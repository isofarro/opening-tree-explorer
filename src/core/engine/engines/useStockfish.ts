import { useEffect, useRef, useState, useCallback } from 'react';
import type { UseEngineWorker } from '../types';

export function useStockfish(): UseEngineWorker {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [workerAlive, setWorkerAlive] = useState(true);
  const restartCountRef = useRef(0);
  const maxRestarts = 3;
  const isAnalyzingRef = useRef(false);
  const lastNonAnalysisActivityRef = useRef<number>(Date.now());
  const healthCheckIntervalRef = useRef<NodeJS.Timeout>(null);

  const createWorker = useCallback(() => {
    try {
      const worker = new Worker('/stockfish/stockfish.js');
      workerRef.current = worker;
      setWorkerAlive(true);
      setReady(false);
      lastNonAnalysisActivityRef.current = Date.now();

      worker.onmessage = (event) => {
        try {
          const message = event.data as string;

          if (message.includes('uciok')) {
            setReady(true);
            console.log('Stockfish engine ready');
          }

          if (message.includes('readyok')) {
            setWorkerAlive(true);
            lastNonAnalysisActivityRef.current = Date.now();
          }

          // Track analysis state
          if (message.startsWith('info')) {
            isAnalyzingRef.current = true;
            // Update activity timestamp for info messages during analysis
            lastNonAnalysisActivityRef.current = Date.now();
          } else if (message.startsWith('bestmove')) {
            isAnalyzingRef.current = false;
            lastNonAnalysisActivityRef.current = Date.now();
          }

          // Add all output to the output array (keep last 500 messages)
          setOutput((prev) => {
            const newOutput = [...prev, message];
            return newOutput.slice(-500);
          });
        } catch (error) {
          console.error('Error processing worker message:', error);
          handleWorkerError('Message processing error');
        }
      };

      worker.onerror = (error) => {
        console.error('Stockfish worker error:', error);
        handleWorkerError('Worker error event');
      };

      // Send UCI command to initialize
      worker.postMessage('uci');

      return worker;
    } catch (error) {
      console.error('Failed to create Stockfish worker:', error);
      handleWorkerError('Worker creation failed');
      return null;
    }
  }, []);

  const handleWorkerError = useCallback(
    (reason: string) => {
      console.warn(`Worker error detected: ${reason}`);
      setWorkerAlive(false);
      setReady(false);

      if (restartCountRef.current < maxRestarts) {
        restartCountRef.current++;
        console.log(
          `Attempting to restart worker (attempt ${restartCountRef.current}/${maxRestarts})`
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
    [createWorker]
  );

  const startHealthCheck = useCallback(() => {
    // Clear existing health check
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    healthCheckIntervalRef.current = setInterval(() => {
      if (workerRef.current && workerAlive) {
        const timeSinceLastActivity = Date.now() - lastNonAnalysisActivityRef.current;

        // Only check health when NOT analyzing, or if it's been a very long time
        if (!isAnalyzingRef.current) {
          // If not analyzing and no response for 30 seconds, check health
          if (timeSinceLastActivity > 30000) {
            try {
              workerRef.current.postMessage('isready');

              // Give it 10 seconds to respond
              setTimeout(() => {
                const currentTimeSinceActivity = Date.now() - lastNonAnalysisActivityRef.current;
                if (currentTimeSinceActivity > 40000 && !isAnalyzingRef.current) {
                  handleWorkerError('Health check timeout (not analyzing)');
                }
              }, 10000);
            } catch (error) {
              console.error('Error sending health check:', error);
              handleWorkerError('Health check send failed');
            }
          }
        } else {
          // If analyzing for more than 10 minutes without any output, something might be wrong
          if (timeSinceLastActivity > 600000) {
            console.warn(
              'Very long analysis period detected (10+ minutes), checking worker health'
            );
            try {
              // Instead of sending stop, send isready which doesn't interrupt analysis
              workerRef.current.postMessage('isready');
              setTimeout(() => {
                const currentTimeSinceActivity = Date.now() - lastNonAnalysisActivityRef.current;
                // Only restart if we haven't received ANY messages (including info) for 10+ minutes
                if (currentTimeSinceActivity > 610000) {
                  handleWorkerError('Worker unresponsive during long analysis');
                }
              }, 10000);
            } catch (error) {
              handleWorkerError('Worker communication failed during long analysis');
            }
          }
        }
      }
    }, 15000); // Check every 15 seconds
  }, [workerAlive, handleWorkerError]);

  useEffect(() => {
    createWorker();
    startHealthCheck();

    // Reset restart count on successful initialization
    const resetTimer = setTimeout(() => {
      if (ready && workerAlive) {
        restartCountRef.current = 0;
      }
    }, 30000); // Wait 30 seconds before resetting

    return () => {
      clearTimeout(resetTimer);
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const send = useCallback(
    (cmd: string) => {
      if (!workerRef.current || !workerAlive) {
        console.warn('Cannot send command: worker not available or not alive');
        return;
      }

      try {
        workerRef.current.postMessage(cmd);

        // Update activity timestamp for non-analysis commands
        if (!cmd.startsWith('go')) {
          lastNonAnalysisActivityRef.current = Date.now();
        }
      } catch (error) {
        console.error('Error sending command to worker:', error);
        handleWorkerError('Command send failed');
      }
    },
    [workerAlive, handleWorkerError]
  );

  return {
    ready: ready && workerAlive,
    output,
    send,
  };
}
