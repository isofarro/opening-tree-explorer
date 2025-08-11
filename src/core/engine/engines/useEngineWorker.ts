import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseEngineWorkerReturn {
  worker: Worker | null;
  ready: boolean;
  alive: boolean;
  output: string[];
  send: (message: string) => void;
  restart: () => void;
  terminate: () => void;
}

export interface EngineWorkerConfig {
  workerPath: string;
  initCommand?: string;
  readyResponsePattern?: string;
  maxRestarts?: number;
  healthCheckInterval?: number;
  healthCheckTimeout?: number;
  maxOutputMessages?: number;
}

const DEFAULT_CONFIG: Required<EngineWorkerConfig> = {
  workerPath: '/stockfish/stockfish.js',
  initCommand: 'uci',
  readyResponsePattern: 'uciok',
  maxRestarts: 3,
  healthCheckInterval: 15000, // 15 seconds
  healthCheckTimeout: 10000, // 10 seconds
  maxOutputMessages: 500,
};

export function useEngineWorker(config: EngineWorkerConfig): UseEngineWorkerReturn {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const [alive, setAlive] = useState(true);
  const [output, setOutput] = useState<string[]>([]);

  const restartCountRef = useRef(0);
  const isAnalyzingRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingHealthCheckRef = useRef<NodeJS.Timeout | null>(null);

  const handleWorkerError = useCallback(
    (reason: string) => {
      console.warn(`Worker error detected: ${reason}`);
      setAlive(false);
      setReady(false);

      if (restartCountRef.current < fullConfig.maxRestarts) {
        restartCountRef.current++;
        console.log(
          `Attempting to restart worker (attempt ${restartCountRef.current}/${fullConfig.maxRestarts})`
        );

        // Clean up current worker
        if (workerRef.current) {
          try {
            workerRef.current.terminate();
          } catch (e) {
            console.warn('Error terminating worker:', e);
          }
        }

        // Restart after a short delay
        setTimeout(() => {
          createWorker();
          startHealthCheck();
        }, 1000);
      } else {
        console.error('Maximum restart attempts reached. Worker will not be restarted.');
      }
    },
    [fullConfig.maxRestarts]
  );

  const createWorker = useCallback(() => {
    try {
      const worker = new Worker(fullConfig.workerPath);
      workerRef.current = worker;
      setAlive(true);
      setReady(false);
      lastActivityRef.current = Date.now();

      worker.onmessage = (event) => {
        try {
          const message = event.data as string;

          // Check for ready signal
          if (message.includes(fullConfig.readyResponsePattern)) {
            setReady(true);
            console.log('Engine worker ready');
          }

          // Check for health check response
          if (message.includes('readyok')) {
            setAlive(true);
            lastActivityRef.current = Date.now();

            // Clear pending health check timeout
            if (pendingHealthCheckRef.current) {
              clearTimeout(pendingHealthCheckRef.current);
              pendingHealthCheckRef.current = null;
            }
          }

          // Track analysis state for health monitoring
          if (message.startsWith('info')) {
            isAnalyzingRef.current = true;
            lastActivityRef.current = Date.now();
          } else if (message.startsWith('bestmove')) {
            isAnalyzingRef.current = false;
            lastActivityRef.current = Date.now();
          }

          // Add to output array with size limit
          setOutput((prev) => {
            const newOutput = [...prev, message];
            return newOutput.slice(-fullConfig.maxOutputMessages);
          });
        } catch (error) {
          console.error('Error processing worker message:', error);
          handleWorkerError('Message processing error');
        }
      };

      worker.onerror = (error) => {
        console.error('Engine worker error:', error);
        handleWorkerError('Worker error event');
      };

      // Send initialization command
      if (fullConfig.initCommand) {
        worker.postMessage(fullConfig.initCommand);
      }

      return worker;
    } catch (error) {
      console.error('Failed to create engine worker:', error);
      handleWorkerError('Worker creation failed');
      return null;
    }
  }, [fullConfig, handleWorkerError]);

  const startHealthCheck = useCallback(() => {
    // Clear existing health check
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    healthCheckIntervalRef.current = setInterval(() => {
      if (workerRef.current && alive) {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;

        // Health check logic based on analysis state
        if (!isAnalyzingRef.current) {
          // When not analyzing, check health if inactive for 5 minutes
          if (timeSinceLastActivity > 300000) {
            try {
              workerRef.current.postMessage('isready');

              // Set timeout for health check response
              pendingHealthCheckRef.current = setTimeout(() => {
                const currentTimeSinceActivity = Date.now() - lastActivityRef.current;
                if (currentTimeSinceActivity > 310000 && !isAnalyzingRef.current) {
                  handleWorkerError('Health check timeout (not analyzing)');
                }
              }, fullConfig.healthCheckTimeout);
            } catch (error) {
              console.error('Error sending health check:', error);
              handleWorkerError('Health check send failed');
            }
          }
        } else {
          // During analysis, check if unresponsive for 10+ minutes
          if (timeSinceLastActivity > 600000) {
            console.warn(
              'Very long analysis period detected (10+ minutes), checking worker health'
            );
            try {
              workerRef.current.postMessage('isready');

              pendingHealthCheckRef.current = setTimeout(() => {
                const currentTimeSinceActivity = Date.now() - lastActivityRef.current;
                if (currentTimeSinceActivity > 610000) {
                  handleWorkerError('Worker unresponsive during long analysis');
                }
              }, fullConfig.healthCheckTimeout);
            } catch (error) {
              handleWorkerError('Worker communication failed during long analysis');
            }
          }
        }
      }
    }, fullConfig.healthCheckInterval);
  }, [alive, fullConfig.healthCheckInterval, fullConfig.healthCheckTimeout, handleWorkerError]);

  const send = useCallback(
    (cmd: string) => {
      if (!workerRef.current || !alive) {
        console.warn('Cannot send command: worker not available or not alive');
        return;
      }

      try {
        workerRef.current.postMessage(cmd);

        // Update activity timestamp for non-analysis commands
        if (!cmd.startsWith('go')) {
          lastActivityRef.current = Date.now();
        }
      } catch (error) {
        console.error('Error sending command to worker:', error);
        handleWorkerError('Command send failed');
      }
    },
    [alive, handleWorkerError]
  );

  const restart = useCallback(() => {
    console.log('Manual worker restart requested');
    restartCountRef.current = 0; // Reset restart count for manual restarts
    handleWorkerError('Manual restart');
  }, [handleWorkerError]);

  const terminate = useCallback(() => {
    console.log('Terminating worker');

    // Clear all timers
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
    if (pendingHealthCheckRef.current) {
      clearTimeout(pendingHealthCheckRef.current);
      pendingHealthCheckRef.current = null;
    }

    // Terminate worker
    if (workerRef.current) {
      try {
        workerRef.current.terminate();
      } catch (e) {
        console.warn('Error terminating worker:', e);
      }
      workerRef.current = null;
    }

    setReady(false);
    setAlive(false);
  }, []);

  // Initialize worker on mount
  useEffect(() => {
    createWorker();
    startHealthCheck();

    // Reset restart count on successful initialization
    const resetTimer = setTimeout(() => {
      if (ready && alive) {
        restartCountRef.current = 0;
      }
    }, 30000);

    return () => {
      clearTimeout(resetTimer);
      terminate();
    };
  }, []);

  return {
    worker: workerRef.current,
    ready: ready && alive,
    alive,
    output,
    send,
    restart,
    terminate,
  };
}
