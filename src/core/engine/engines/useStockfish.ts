import { useMemo } from 'react';
import { useEngineWorker } from './useEngineWorker';
import { useUciProtocol } from './useUciProtocol';
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

  const uciProtocol = useUciProtocol(engineWorker);

  // Adapt to the existing UseEngineWorker interface for backward compatibility
  return useMemo(
    () => ({
      ready: uciProtocol.ready,
      output: uciProtocol.output,
      send: engineWorker.send, // Keep direct send for backward compatibility
      // Expose UCI protocol methods for advanced usage
      uci: uciProtocol,
    }),
    [uciProtocol, engineWorker.send]
  );
}

// Export the enhanced interface for new code
export interface EnhancedUseEngineWorker extends UseEngineWorker {
  uci: ReturnType<typeof useUciProtocol>;
}
