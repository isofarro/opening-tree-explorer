import { useState, useEffect, useRef } from 'react';
import { useUciEngine } from '~/core/engine';
import { useStockfish } from '~/core/engine/engines/useStockfish';
import type { AnalysisResult } from '~/core/engine/types';
import type { FenString } from '~/core/types';
import { formatEval } from '../lib/uci';

type EngineAnalysisProps = {
  position: FenString;
};

export const EngineAnalysis = ({ position }: EngineAnalysisProps) => {
  const stockfishEngine = useStockfish();
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [maxDepth, setMaxDepth] = useState<number>(0);
  const [autoAnalyze, setAutoAnalyze] = useState<boolean>(false);
  const currentAnalysisPosition = useRef<FenString | null>(null);

  const { startAnalysis, stopAnalysis, isReady, isAnalyzing, currentResults } = useUciEngine({
    engineWorker: stockfishEngine,
    onAnalysisUpdate: (result) => {
      // This callback is called for each new analysis result
      console.log('New analysis result:', result);
      setAnalysisHistory((prev) => [...prev, result]);
      setMaxDepth(Math.max(maxDepth, result.depth));
    },
  });

  useEffect(() => {
    console.log('[EngineAnalysis] position changed:', position);
  }, [position]);

  // Auto-analyze when position changes OR restart analysis if position changed during analysis
  useEffect(() => {
    if (isReady && position) {
      // If auto-analyze is enabled, always start analysis
      if (autoAnalyze) {
        console.log('Position changed, starting analysis for:', position);
        setMaxDepth(0);
        setAnalysisHistory([]);
        currentAnalysisPosition.current = position;
        startAnalysis(position, {
          numVariations: 3,
        });
      }
      // If currently analyzing and position changed, restart for new position
      else if (isAnalyzing && currentAnalysisPosition.current !== position) {
        console.log('Position changed during analysis, restarting for:', position);
        setMaxDepth(0);
        setAnalysisHistory([]);
        currentAnalysisPosition.current = position;
        startAnalysis(position, {
          numVariations: 3,
        });
      }
    }
  }, [position, isReady, autoAnalyze, isAnalyzing, startAnalysis]);

  const analyzePosition = () => {
    if (!isReady) return;

    setMaxDepth(0);
    setAnalysisHistory([]);
    currentAnalysisPosition.current = position;
    startAnalysis(position, {
      numVariations: 3,
    });
  };

  const toggleAutoAnalyze = () => {
    setAutoAnalyze(!autoAnalyze);
    if (!autoAnalyze && isReady && position) {
      // If turning on auto-analyze, start analysis immediately
      analyzePosition();
    }
  };

  return (
    <section>
      <header>
        <div>
          {isAnalyzing ? (
            <button onClick={stopAnalysis} disabled={!isAnalyzing}>
              Stop Analysis
            </button>
          ) : (
            <button onClick={analyzePosition} disabled={!isReady || isAnalyzing}>
              Start Analysis
            </button>
          )}
          <span>Ready: {isReady.toString()}</span>
          <span> | Analyzing: {isAnalyzing.toString()}</span>
        </div>
      </header>
      <div>
        {currentResults
          .slice(-3)
          .sort((a, b) => (a.multipv || 1) - (b.multipv || 1))
          .map((result) => (
            <div key={`${result.depth}-${result.multipv || 1}`}>
              <strong>
                {result.multipv || 1}. {formatEval(result.score, result.scoreType)}/{result.depth}
              </strong>
              : {result.pv.join(' ')}
            </div>
          ))}
      </div>
    </section>
  );
};
