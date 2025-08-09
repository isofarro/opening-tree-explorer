import { useCallback, useRef, useState, useEffect } from "react";
import type { AnalysisOptions, AnalysisResult, UseEngineWorker, UseUciEngineResponse } from "./types";

type AnalysisPromise = {
    resolve: (results: AnalysisResult[]) => void;
    reject: (error: Error) => void;
    results: AnalysisResult[];
    isRunning: boolean;
}

export function useUciEngine(engineWorker: UseEngineWorker): UseUciEngineResponse {
  const [isReady, setIsReady] = useState(false);
  const analysisPromiseRef = useRef<AnalysisPromise | null>(null);
  const outputIndexRef = useRef(0);

  useEffect(() => {
    // Reset ready state when engine changes
    setIsReady(engineWorker.ready);
  }, [engineWorker.ready]);

  useEffect(() => {
    // Monitor output for UCI messages
    const newOutput = engineWorker.output.slice(outputIndexRef.current);
    outputIndexRef.current = engineWorker.output.length;

    newOutput.forEach(message => {
      if (message.includes('uciok')) {
        setIsReady(true);
        return;
      }
      
      if (message.includes('readyok')) {
        return;
      }
      
      // Parse analysis output
      if (message.startsWith('info') && analysisPromiseRef.current?.isRunning) {
        const result = parseUciInfo(message);
        if (result) {
          const currentPromise = analysisPromiseRef.current;
          // Update or add the result for this variation
          const existingIndex = currentPromise.results.findIndex(r => r.depth === result.depth);
          if (existingIndex >= 0) {
            currentPromise.results[existingIndex] = result;
          } else {
            currentPromise.results.push(result);
          }
        }
      }
      
      // Analysis complete
      if (message.startsWith('bestmove') && analysisPromiseRef.current?.isRunning) {
        const currentPromise = analysisPromiseRef.current;
        currentPromise.isRunning = false;
        currentPromise.resolve([...currentPromise.results]);
        analysisPromiseRef.current = null;
      }
    });
  }, [engineWorker.output]);

  const analyse = useCallback(async (fen: string, options: AnalysisOptions = {}): Promise<AnalysisResult[]> => {
    if (!isReady) {
      throw new Error('Engine is not ready');
    }
    
    if (analysisPromiseRef.current?.isRunning) {
      stop();
    }

    return new Promise((resolve, reject) => {
      analysisPromiseRef.current = {
        resolve,
        reject,
        results: [],
        isRunning: true
      };
      
      // Set position
      engineWorker.send(`position fen ${fen}`);
      
      // Configure analysis options
      const { depth, time, numVariations = 1 } = options;
      
      if (numVariations > 1) {
        engineWorker.send(`setoption name MultiPV value ${numVariations}`);
      }
      
      // Start analysis
      let goCommand = 'go';
      if (depth !== undefined) {
        goCommand += ` depth ${depth}`;
      } else if (time !== undefined) {
        goCommand += ` movetime ${time}`;
      } else {
        goCommand += ' infinite';
      }
      
      engineWorker.send(goCommand);
      
      // Set timeout for analysis (30 seconds max)
      setTimeout(() => {
        if (analysisPromiseRef.current?.isRunning) {
          stop();
          reject(new Error('Analysis timeout'));
        }
      }, 30000);
    });
  }, [isReady, engineWorker]);

  const stop = useCallback(() => {
    if (analysisPromiseRef.current?.isRunning) {
      engineWorker.send('stop');
      const currentPromise = analysisPromiseRef.current;
      currentPromise.isRunning = false;
      currentPromise.resolve([...currentPromise.results]);
      analysisPromiseRef.current = null;
    }
  }, [engineWorker]);

  return { analyse, stop, isReady };
}

// Helper function to parse UCI info messages
function parseUciInfo(message: string): AnalysisResult | null {
  const parts = message.split(' ');
  const result: Partial<AnalysisResult> = {};
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    switch (part) {
      case 'depth':
        result.depth = parseInt(parts[i + 1]);
        break;
      case 'seldepth':
        result.seldepth = parseInt(parts[i + 1]);
        break;
      case 'time':
        result.time = parseInt(parts[i + 1]);
        break;
      case 'nodes':
        result.nodes = parseInt(parts[i + 1]);
        break;
      case 'nps':
        result.nps = parseInt(parts[i + 1]);
        break;
      case 'score':
        const scoreType = parts[i + 1];
        const scoreValue = parseInt(parts[i + 2]);
        if (scoreType === 'cp') {
          result.scoreType = 'cp';
          result.score = scoreValue;
        } else if (scoreType === 'mate') {
          result.scoreType = 'mate';
          result.score = scoreValue;
        }
        break;
      case 'pv':
        result.pv = parts.slice(i + 1);
        break;
    }
  }
  
  // Only return if we have essential data
  if (result.depth !== undefined && result.score !== undefined && result.scoreType && result.pv) {
    return result as AnalysisResult;
  }
  
  return null;
}