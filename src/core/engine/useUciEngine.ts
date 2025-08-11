import { useCallback, useRef, useState, useEffect } from 'react';
import type { AnalysisOptions, AnalysisResult } from './types';
import type { EnhancedUseEngineWorker } from './engines/useStockfish';

interface UseUciEngineReturn {
  startAnalysis: (fen: string, options?: AnalysisOptions) => Promise<void>;
  stopAnalysis: () => Promise<void>;
  isReady: boolean;
  isAnalyzing: boolean;
  currentResults: AnalysisResult[];
  onAnalysisUpdate?: (result: AnalysisResult) => void;
}

interface UseUciEngineProps {
  engineWorker: EnhancedUseEngineWorker;
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
  const currentPositionRef = useRef<string>('');
  const analysisStartTimeRef = useRef<number>(0);
  const analysisAbortControllerRef = useRef<AbortController | null>(null);

  const analysisStateRef = useRef<{
    isRunning: boolean;
    numVariations: number;
    startTime: number;
    positionFen: string;
  }>({
    isRunning: false,
    numVariations: 1,
    startTime: 0,
    positionFen: '',
  });

  // Track engine readiness
  useEffect(() => {
    setIsReady(engineWorker.ready);
  }, [engineWorker.ready]);

  // Process engine output for analysis results
  useEffect(() => {
    const newOutput = engineWorker.output.slice(outputIndexRef.current);
    outputIndexRef.current = engineWorker.output.length;

    newOutput.forEach((message) => {
      try {
        // Parse analysis output
        if (message.startsWith('info') && analysisStateRef.current.isRunning) {
          const result = parseUciInfo(message);
          if (result) {
            // Only process results if they're for the current position AND
            // the result timestamp is after we started the current analysis
            const resultTime = Date.now();
            if (
              analysisStateRef.current.positionFen === currentPositionRef.current &&
              resultTime >= analysisStartTimeRef.current
            ) {
              // Update current results state
              setCurrentResults((prevResults) => {
                const existingIndex = prevResults.findIndex(
                  (r) =>
                    r.depth === result.depth &&
                    (result.multipv ? r.multipv === result.multipv : true)
                );

                let newResults;
                if (existingIndex >= 0) {
                  newResults = [...prevResults];
                  newResults[existingIndex] = result;
                } else {
                  newResults = [...prevResults, result];
                }

                return newResults.slice(-100);
              });

              onAnalysisUpdate?.(result);
            } else {
              console.log(
                'Ignoring stale analysis result from previous position or before analysis start'
              );
            }
          }
        }

        // Analysis complete
        if (message.startsWith('bestmove') && analysisStateRef.current.isRunning) {
          // Only process bestmove if it's for the current position
          if (analysisStateRef.current.positionFen === currentPositionRef.current) {
            setIsAnalyzing(false);
            analysisStateRef.current.isRunning = false;
            console.log('Analysis completed');
          } else {
            console.log('Ignoring stale bestmove from previous position');
          }
        }
      } catch (error: unknown) {
        console.error('Error processing engine message:', error);
      }
    });
  }, [engineWorker.output, onAnalysisUpdate]);

  const stopAnalysis = useCallback(async (): Promise<void> => {
    if (!analysisStateRef.current.isRunning) {
      return;
    }

    try {
      // Abort any pending operations
      if (analysisAbortControllerRef.current) {
        analysisAbortControllerRef.current.abort();
        analysisAbortControllerRef.current = null;
      }

      // Send stop command - don't fail the entire operation if it times out
      try {
        await engineWorker.uci.stopAnalysis();
      } catch (stopError) {
        console.warn('Stop command timed out, but continuing with state cleanup:', stopError);
      }

      setIsAnalyzing(false);
      analysisStateRef.current.isRunning = false;
      console.log('Analysis stopped');
    } catch (error) {
      console.error('Error stopping analysis:', error);
      // Force stop even if UCI command failed
      setIsAnalyzing(false);
      analysisStateRef.current.isRunning = false;
    }
  }, [engineWorker]);

  const startAnalysis = useCallback(
    async (fen: string, options: AnalysisOptions = {}): Promise<void> => {
      if (!isReady) {
        throw new Error('Engine is not ready');
      }

      try {
        // If already analyzing, stop first
        if (analysisStateRef.current.isRunning) {
          console.log('Stopping previous analysis before starting new one');
          await stopAnalysis();

          // Give the engine a moment to process the stop
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Clear previous results and reset state
        setCurrentResults([]);
        setIsAnalyzing(true);
        analysisStateRef.current.isRunning = true;
        analysisStateRef.current.startTime = Date.now();
        analysisStateRef.current.positionFen = fen;
        currentPositionRef.current = fen;
        analysisStartTimeRef.current = Date.now();

        // Create abort controller for this analysis session
        analysisAbortControllerRef.current = new AbortController();

        // Configure analysis options
        const { depth, time, numVariations = 1 } = options;
        analysisStateRef.current.numVariations = numVariations;

        // Ensure engine is ready with retry logic
        let engineReady = false;
        for (let attempt = 0; attempt < 2; attempt++) {
          engineReady = await engineWorker.uci.isReady();
          if (engineReady) break;

          console.warn(`Engine readiness check failed (attempt ${attempt + 1}/2), retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (!engineReady) {
          throw new Error('Engine failed readiness check after retries');
        }

        // Set position
        await engineWorker.uci.setPosition(fen);

        // Set multi-variation option if needed
        if (numVariations > 1) {
          await engineWorker.uci.setOption('MultiPV', numVariations);
        }

        // Start analysis with appropriate options
        const analysisOptions: AnalysisOptions = {};
        if (depth !== undefined) {
          analysisOptions.depth = depth;
        } else if (time !== undefined) {
          analysisOptions.time = time;
        } else {
          analysisOptions.infinite = true;
        }

        await engineWorker.uci.startAnalysis(analysisOptions);
        console.log(`Started analysis for position: ${fen}`);
      } catch (error) {
        console.error('Error starting analysis:', error);
        setIsAnalyzing(false);
        analysisStateRef.current.isRunning = false;
        throw error;
      }
    },
    [isReady, engineWorker, stopAnalysis]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisAbortControllerRef.current) {
        analysisAbortControllerRef.current.abort();
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

// Helper function to parse UCI info messages (unchanged)
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
