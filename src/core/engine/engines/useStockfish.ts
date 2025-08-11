import { useMemo } from 'react';
import { useEngineWorker } from './useEngineWorker';
import type { UseEngineWorker } from '../types';

export function useStockfish(): UseEngineWorker {
  const engineWorker = useEngineWorker({
    workerPath: '/stockfish/stockfish.js',
    initCommand: 'uci',
    readyResponsePattern: 'uciok',
    maxRestarts: 3,
    healthCheckInterval: 15000,
    healthCheckTimeout: 10000,
    maxOutputMessages: 500,
  });

  // Adapt the new interface to the existing UseEngineWorker interface
  return useMemo(
    () => ({
      ready: engineWorker.ready,
      output: engineWorker.output,
      send: engineWorker.send,
    }),
    [engineWorker.ready, engineWorker.output, engineWorker.send]
  );
}
