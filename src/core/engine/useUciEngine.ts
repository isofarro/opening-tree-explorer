import { useCallback, useRef, useState, useEffect } from 'react';
import type { AnalysisOptions, AnalysisResult, UseEngineWorker } from './types';

interface UseUciEngineReturn {
  startAnalysis: (fen: string, options?: AnalysisOptions) => void;
  stopAnalysis: () => void;
  isReady: boolean;
  isAnalyzing: boolean;
  currentResults: AnalysisResult[];
  onAnalysisUpdate?: (result: AnalysisResult) => void;
}

interface UseUciEngineProps {
  engineWorker: UseEngineWorker;
  onAnalysisUpdate?: (result: AnalysisResult) => void;
}

export function useUciEngine({
  engineWorker,
  onAnalysisUpdate,
}: UseUciEngineProps): UseUciEngineReturn {
  const [isReady, setIsReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResults, setCurrentResults] = useState<AnalysisResult[]>([]);

  const outputIndexRef = useRef(0);
  const analysisStateRef = useRef<{
    isRunning: boolean;
    numVariations: number;
    startTime: number;
  }>({ isRunning: false, numVariations: 1, startTime: 0 });

  const analysisTimeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    setIsReady(engineWorker.ready);
  }, [engineWorker.ready]);

  useEffect(() => {
    const newOutput = engineWorker.output.slice(outputIndexRef.current);
    outputIndexRef.current = engineWorker.output.length;

    newOutput.forEach((message) => {
      try {
        if (message.includes('uciok')) {
          setIsReady(true);
          return;
        }

        if (message.includes('readyok')) {
          return;
        }

        // Parse analysis output
        if (message.startsWith('info') && analysisStateRef.current.isRunning) {
          const result = parseUciInfo(message);
          if (result) {
            // Update current results state
            setCurrentResults((prevResults) => {
              const existingIndex = prevResults.findIndex(
                (r) =>
                  r.depth === result.depth && (result.multipv ? r.multipv === result.multipv : true)
              );

              let newResults;
              if (existingIndex >= 0) {
                newResults = [...prevResults];
                newResults[existingIndex] = result;
              } else {
                newResults = [...prevResults, result];
              }

              // Limit results to prevent memory issues
              return newResults.slice(-100);
            });

            onAnalysisUpdate?.(result);
          }
        }

        // Analysis complete
        if (message.startsWith('bestmove') && analysisStateRef.current.isRunning) {
          setIsAnalyzing(false);
          analysisStateRef.current.isRunning = false;

          if (analysisTimeoutRef.current) {
            clearTimeout(analysisTimeoutRef.current);
          }
        }
      } catch (error) {
        console.error('Error processing UCI message:', error, 'Message:', message);
      }
    });
  }, [engineWorker.output, onAnalysisUpdate]);

  const startAnalysis = useCallback(
    (fen: string, options: AnalysisOptions = {}) => {
      if (!isReady) {
        console.warn('Engine is not ready');
        return;
      }

      if (analysisStateRef.current.isRunning) {
        stopAnalysis();
      }

      // Clear previous results
      setCurrentResults([]);
      setIsAnalyzing(true);
      analysisStateRef.current.isRunning = true;
      analysisStateRef.current.startTime = Date.now();

      // Configure analysis options
      const { depth, time, numVariations = 1 } = options;
      analysisStateRef.current.numVariations = numVariations;

      try {
        // Set position
        engineWorker.send(`position fen ${fen}`);

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

          // Set safety timeout for infinite analysis (15 minutes)
          analysisTimeoutRef.current = setTimeout(() => {
            if (analysisStateRef.current.isRunning) {
              console.warn('Analysis timeout reached (15 minutes), stopping...');
              stopAnalysis();
            }
          }, 900000); // 15 minutes
        }

        engineWorker.send(goCommand);
      } catch (error) {
        console.error('Error starting analysis:', error);
        setIsAnalyzing(false);
        analysisStateRef.current.isRunning = false;
      }
    },
    [isReady, engineWorker]
  );

  const stopAnalysis = useCallback(() => {
    if (analysisStateRef.current.isRunning) {
      try {
        engineWorker.send('stop');
      } catch (error) {
        console.error('Error stopping analysis:', error);
      }

      setIsAnalyzing(false);
      analysisStateRef.current.isRunning = false;

      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    }
  }, [engineWorker]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  return {
    startAnalysis,
    stopAnalysis,
    isReady,
    isAnalyzing,
    currentResults,
    onAnalysisUpdate,
  };
}

// Helper function to parse UCI info messages
function parseUciInfo(message: string): AnalysisResult | null {
  const parts = message.split(' ');
  const result: Partial<AnalysisResult & { multipv?: number }> = {};

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
      case 'multipv':
        result.multipv = parseInt(parts[i + 1]);
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
