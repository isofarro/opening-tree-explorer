import { useState } from 'react';
import { useUciEngine } from '~/core/engine';
import { useStockfish } from '~/core/engine/engines/useStockfish';
import type { AnalysisResult } from '~/core/engine/types';
import type { FenString } from '~/core/types';
import { formatEval } from '../lib/uci';

type EngineAnalysisProps = {
  position: FenString;
}

export const EngineAnalysis = ({ position }: EngineAnalysisProps) => {
  const stockfishEngine = useStockfish();
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [maxDepth, setMaxDepth] = useState<number>(0);

  const { startAnalysis, stopAnalysis, isReady, isAnalyzing, currentResults } = useUciEngine({
    engineWorker: stockfishEngine,
    onAnalysisUpdate: (result) => {
      // This callback is called for each new analysis result
      console.log('New analysis result:', result);
      setAnalysisHistory((prev) => [...prev, result]);
      setMaxDepth(Math.max(maxDepth, result.depth));
    },
  });

  const analyzePosition = () => {
    if (!isReady) return;

    setMaxDepth(0);
    startAnalysis(position, {
      numVariations: 3,
    });
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
          // .filter((result) => result.depth === maxDepth)
          .slice(-3)
          .sort((a, b) => (a.multipv || 1) - (b.multipv || 1))
          .map((result) => (
            <div key={`${result.depth}-${result.multipv || 1}`}>
              <strong>{result.multipv || 1}.</strong>
              {' '}
              {formatEval(result.score, result.scoreType)}/{result.depth}: {' '}
              {result.pv.slice(0, 5).join(' ')}
            </div>
          ))
        }
      </div>
      {/* <div>
        <h4>Analysis Stream ({analysisHistory.length} updates):</h4>
        <div style={{ maxHeight: 200, overflow: 'auto' }}>
          {analysisHistory.slice(-10).map((result, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
              D{result.depth}: {result.score}
              {result.scoreType} - {result.pv.slice(0, 3).join(' ')}
            </div>
          ))}
        </div>
      </div> */}
    </section>
  );
};
