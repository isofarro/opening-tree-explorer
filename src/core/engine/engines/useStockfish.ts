import { useEffect, useRef, useState, useCallback } from "react";
import type { UseEngineWorker } from "../types";

export function useStockfish(): UseEngineWorker {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const [output, setOutput] = useState<string[]>([]);

  useEffect(() => {
    // Use the stockfish.js file directly as a worker
    const worker = new Worker("/stockfish/stockfish.js");

    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const message = e.data;
      
      // Stockfish.js sends raw UCI output as strings
      if (typeof message === 'string') {
        // Check if it's the UCI ready message
        if (message.includes('uciok')) {
          setReady(true);
        }
        
        // Add all output to the output array
        setOutput((prev) => [...prev.slice(-200), message]);
      }
    };

    worker.onerror = (error) => {
      console.error("Stockfish worker error:", error);
    };

    // Send UCI command to initialize
    worker.postMessage("uci");

    return () => {
      worker.terminate();
    };
  }, []);

  const send = useCallback((cmd: string) => {
    workerRef.current?.postMessage(cmd);
  }, []);

  return { ready, output, send };
}
