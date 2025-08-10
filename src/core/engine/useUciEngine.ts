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
  const currentPositionRef = useRef<string>(''); // Track current position
  const analysisStateRef = useRef<{
    isRunning: boolean;
    numVariations: number;
    startTime: number;
    depthTimes: Map<number, number>;
    lastActivityTime: number;
    currentDepth: number;
    positionFen: string; // Add position tracking
  }>({
    isRunning: false,
    numVariations: 1,
    startTime: 0,
    depthTimes: new Map(),
    lastActivityTime: 0,
    currentDepth: 0,
    positionFen: '',
  });

  // Function to calculate adaptive timeout based on recent activity
  const calculateAdaptiveTimeout = useCallback((currentDepth: number): number => {
    const depthTimes = analysisStateRef.current.depthTimes;

    if (depthTimes.size > 0) {
      const recentDepths = Array.from(depthTimes.entries())
        .filter(([depth]) => depth >= Math.max(1, currentDepth - 3))
        .map(([, time]) => time);

      if (recentDepths.length > 0) {
        const avgRecentTime =
          recentDepths.reduce((sum, time) => sum + time, 0) / recentDepths.length;
        // Use 3x the average recent depth time for safety, min 3 minutes, max 45 minutes
        const adaptiveTimeout = Math.max(180000, Math.min(2700000, avgRecentTime * 3));
        return adaptiveTimeout;
      }
    }

    // Fallback: scale with depth, starting at 5 minutes
    const fallbackTimeout = Math.min(
      2700000,
      300000 * Math.pow(1.3, Math.max(0, currentDepth - 15))
    );
    return fallbackTimeout;
  }, []);

  // Function to reset timeout on any analysis activity
  const resetAnalysisTimeout = useCallback(() => {
    if (analysisStateRef.current.isRunning) {
      analysisStateRef.current.lastActivityTime = Date.now();

      // Clear existing timeout
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      const adaptiveTimeout = calculateAdaptiveTimeout(analysisStateRef.current.currentDepth);
      console.log(
        `Resetting timeout: ${Math.round(adaptiveTimeout / 1000)}s (depth ${analysisStateRef.current.currentDepth})`
      );

      analysisTimeoutRef.current = setTimeout(() => {
        if (analysisStateRef.current.isRunning) {
          const timeSinceActivity = Date.now() - analysisStateRef.current.lastActivityTime;
          console.warn(
            `Analysis timeout: no output for ${Math.round(timeSinceActivity / 1000)}s, stopping...`
          );
          stopAnalysis();
        }
      }, adaptiveTimeout);
    }
  }, [calculateAdaptiveTimeout]);

  // Track depth completion for statistics only
  const updateDepthStats = useCallback((newDepth: number) => {
    if (newDepth > analysisStateRef.current.currentDepth) {
      const now = Date.now();
      const previousDepth = analysisStateRef.current.currentDepth;

      // Record time taken for the previous depth (for statistics)
      if (previousDepth > 0 && analysisStateRef.current.lastActivityTime > 0) {
        const depthTime = now - (analysisStateRef.current.lastActivityTime - 60000); // Rough estimate
        analysisStateRef.current.depthTimes.set(previousDepth, depthTime);
        console.log(
          `Depth ${previousDepth} completed in approximately ${Math.round(depthTime / 1000)}s`
        );
      }

      analysisStateRef.current.currentDepth = newDepth;
    }
  }, []);

  const analysisTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Remove the entire updateAdaptiveTimeout function (lines 97-127)
  // Remove the depthCompletionTracker declaration (line 141)

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
            // Only process results if they're for the current position
            // We do this by checking if analysis is still running for the same position
            if (analysisStateRef.current.positionFen === currentPositionRef.current) {
              // Reset timeout on ANY analysis result
              resetAnalysisTimeout();

              // Update depth statistics
              if (result.depth > analysisStateRef.current.currentDepth) {
                updateDepthStats(result.depth);
              }

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
              console.log('Ignoring stale analysis result from previous position');
            }
          }
        }

        // Analysis complete
        if (message.startsWith('bestmove') && analysisStateRef.current.isRunning) {
          // Only process bestmove if it's for the current position
          if (analysisStateRef.current.positionFen === currentPositionRef.current) {
            setIsAnalyzing(false);
            analysisStateRef.current.isRunning = false;

            if (analysisTimeoutRef.current) {
              clearTimeout(analysisTimeoutRef.current);
            }
          } else {
            console.log('Ignoring stale bestmove from previous position');
          }
        }
      } catch (error) {
        console.error('Error processing UCI message:', error, 'Message:', message);
      }
    });
  }, [engineWorker.output, onAnalysisUpdate]);

  const startAnalysis = useCallback(
    async (fen: string, options: AnalysisOptions = {}) => {
      if (!isReady) {
        console.warn('Engine is not ready');
        return;
      }

      // If already analyzing, stop and wait for clean shutdown
      if (analysisStateRef.current.isRunning) {
        console.log('Stopping previous analysis before starting new one');
        // Call stopAnalysis inline instead of referencing it
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

        // Wait a brief moment for the stop command to be processed
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Clear previous results and reset all state
      setCurrentResults([]);
      setIsAnalyzing(true);
      analysisStateRef.current.isRunning = true;
      analysisStateRef.current.startTime = Date.now();
      analysisStateRef.current.depthTimes.clear();
      analysisStateRef.current.currentDepth = 0;
      analysisStateRef.current.lastActivityTime = Date.now();
      analysisStateRef.current.positionFen = fen; // Track the position we're analyzing
      currentPositionRef.current = fen; // Update current position reference

      // Configure analysis options
      const { depth, time, numVariations = 1 } = options;
      analysisStateRef.current.numVariations = numVariations;

      try {
        // Ensure engine is ready before setting position
        engineWorker.send('isready');

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

          // Set initial timeout (5 minutes)
          const initialTimeout = 300000;
          console.log(
            `Starting analysis with initial timeout: ${Math.round(initialTimeout / 1000)}s`
          );
          analysisTimeoutRef.current = setTimeout(() => {
            if (analysisStateRef.current.isRunning) {
              console.warn(
                `Initial analysis timeout reached (${Math.round(initialTimeout / 1000)}s), stopping...`
              );
              // Inline stop logic here too
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
            }
          }, initialTimeout);
        }

        engineWorker.send(goCommand);
        console.log(`Started analysis for position: ${fen}`);
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
