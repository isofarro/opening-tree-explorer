import { useCallback, useRef, useEffect, useState } from 'react';
import type { UseEngineWorkerReturn } from './useEngineWorker';

export interface UciCommand {
  command: string;
  expectedResponse?: string | RegExp | ((message: string) => boolean);
  timeout?: number;
}

export interface UseUciProtocolReturn {
  sendCommand: (
    command: string,
    expectedResponse?: string | RegExp | ((message: string) => boolean),
    timeout?: number
  ) => Promise<string[]>;
  isReady: () => Promise<boolean>;
  setPosition: (fen: string) => Promise<void>;
  setOption: (name: string, value: string | number) => Promise<void>;
  startAnalysis: (options?: AnalysisOptions) => Promise<void>;
  stopAnalysis: () => Promise<void>;
  output: string[];
  ready: boolean;
}

export interface AnalysisOptions {
  depth?: number;
  time?: number;
  nodes?: number;
  infinite?: boolean;
}

interface PendingCommand {
  id: string;
  command: string;
  expectedResponse?: string | RegExp | ((message: string) => boolean);
  timeout: number;
  resolve: (messages: string[]) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
  startTime: number;
  receivedMessages: string[];
}

const DEFAULT_TIMEOUTS = {
  isReady: 5000,
  setPosition: 1000,
  setOption: 1000,
  stop: 2000,
  default: 3000,
};

export function useUciProtocol(engineWorker: UseEngineWorkerReturn): UseUciProtocolReturn {
  const [ready, setReady] = useState(false);
  const pendingCommandsRef = useRef<Map<string, PendingCommand>>(new Map());
  const lastCheckedIndexRef = useRef(0);
  const commandIdCounterRef = useRef(0);

  // Track engine readiness
  useEffect(() => {
    setReady(engineWorker.ready);
  }, [engineWorker.ready]);

  // Process new output messages
  useEffect(() => {
    const newMessages = engineWorker.output.slice(lastCheckedIndexRef.current);
    lastCheckedIndexRef.current = engineWorker.output.length;

    if (newMessages.length === 0) return;

    // Process each pending command
    const pendingCommands = Array.from(pendingCommandsRef.current.values());

    newMessages.forEach((message) => {
      pendingCommands.forEach((pendingCommand) => {
        pendingCommand.receivedMessages.push(message);

        // Check if this message satisfies the expected response
        if (pendingCommand.expectedResponse) {
          let matches = false;

          if (typeof pendingCommand.expectedResponse === 'string') {
            matches = message.includes(pendingCommand.expectedResponse);
          } else if (pendingCommand.expectedResponse instanceof RegExp) {
            matches = pendingCommand.expectedResponse.test(message);
          } else if (typeof pendingCommand.expectedResponse === 'function') {
            matches = pendingCommand.expectedResponse(message);
          }

          if (matches) {
            // Command completed successfully
            clearTimeout(pendingCommand.timer);
            pendingCommand.resolve(pendingCommand.receivedMessages);
            pendingCommandsRef.current.delete(pendingCommand.id);
          }
        }
      });
    });
  }, [engineWorker.output]);

  const generateCommandId = useCallback(() => {
    return `cmd_${++commandIdCounterRef.current}_${Date.now()}`;
  }, []);

  const sendCommand = useCallback(
    (
      command: string,
      expectedResponse?: string | RegExp | ((message: string) => boolean),
      timeout = DEFAULT_TIMEOUTS.default
    ): Promise<string[]> => {
      return new Promise((resolve, reject) => {
        if (!engineWorker.ready) {
          reject(new Error('Engine worker is not ready'));
          return;
        }

        const commandId = generateCommandId();
        const startTime = Date.now();

        // Create timeout timer
        const timer = setTimeout(() => {
          const pendingCommand = pendingCommandsRef.current.get(commandId);
          if (pendingCommand) {
            pendingCommandsRef.current.delete(commandId);
            const elapsed = Date.now() - startTime;
            reject(
              new Error(
                `Command "${command}" timed out after ${elapsed}ms (expected: ${timeout}ms)`
              )
            );
          }
        }, timeout);

        // Store pending command
        const pendingCommand: PendingCommand = {
          id: commandId,
          command,
          expectedResponse,
          timeout,
          resolve,
          reject,
          timer,
          startTime,
          receivedMessages: [],
        };

        pendingCommandsRef.current.set(commandId, pendingCommand);

        try {
          // Send the command
          engineWorker.send(command);

          // If no expected response, resolve immediately with current messages
          if (!expectedResponse) {
            clearTimeout(timer);
            pendingCommandsRef.current.delete(commandId);
            resolve([]);
          }
        } catch (error) {
          clearTimeout(timer);
          pendingCommandsRef.current.delete(commandId);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    },
    [engineWorker, generateCommandId]
  );

  const isReady = useCallback(async (): Promise<boolean> => {
    try {
      await sendCommand('isready', 'readyok', DEFAULT_TIMEOUTS.isReady);
      return true;
    } catch (error) {
      console.warn('isReady check failed:', error);
      return false;
    }
  }, [sendCommand]);

  const setPosition = useCallback(
    async (fen: string): Promise<void> => {
      try {
        await sendCommand(`position fen ${fen}`, undefined, DEFAULT_TIMEOUTS.setPosition);
      } catch (error) {
        throw new Error(
          `Failed to set position: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
    [sendCommand]
  );

  const setOption = useCallback(
    async (name: string, value: string | number): Promise<void> => {
      try {
        await sendCommand(
          `setoption name ${name} value ${value}`,
          undefined,
          DEFAULT_TIMEOUTS.setOption
        );
      } catch (error) {
        throw new Error(
          `Failed to set option ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
    [sendCommand]
  );

  const startAnalysis = useCallback(
    async (options: AnalysisOptions = {}): Promise<void> => {
      try {
        let goCommand = 'go';

        if (options.depth !== undefined) {
          goCommand += ` depth ${options.depth}`;
        } else if (options.time !== undefined) {
          goCommand += ` movetime ${options.time}`;
        } else if (options.nodes !== undefined) {
          goCommand += ` nodes ${options.nodes}`;
        } else if (options.infinite !== false) {
          goCommand += ' infinite';
        }

        // Send go command without waiting for response (analysis is async)
        await sendCommand(goCommand, undefined, 1000);
      } catch (error) {
        throw new Error(
          `Failed to start analysis: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
    [sendCommand]
  );

  const stopAnalysis = useCallback(async (): Promise<void> => {
    try {
      await sendCommand('stop', 'bestmove', DEFAULT_TIMEOUTS.stop);
    } catch (error) {
      // Don't throw on stop errors, just log them
      console.warn('Stop command failed:', error);
    }
  }, [sendCommand]);

  // Cleanup pending commands on unmount
  useEffect(() => {
    return () => {
      // Clear all pending commands
      pendingCommandsRef.current.forEach((pendingCommand) => {
        clearTimeout(pendingCommand.timer);
        pendingCommand.reject(new Error('Component unmounted'));
      });
      pendingCommandsRef.current.clear();
    };
  }, []);

  return {
    sendCommand,
    isReady,
    setPosition,
    setOption,
    startAnalysis,
    stopAnalysis,
    output: engineWorker.output,
    ready,
  };
}
