import { useUciEngine } from '~/core/engine';
import { useStockfish } from '~/core/engine/engines/useStockfish';
import { useState } from 'react';
import type { AnalysisResult } from '~/core/engine/types';

export const EngineAnalysis = () => {
  const stockfishEngine = useStockfish();
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);

  const { startAnalysis, stopAnalysis, isReady, isAnalyzing, currentResults } = useUciEngine({
    engineWorker: stockfishEngine,
    onAnalysisUpdate: (result) => {
      // This callback is called for each new analysis result
      console.log('New analysis result:', result);
      setAnalysisHistory((prev) => [...prev, result]);
    },
  });

  const analyzePosition = () => {
    if (!isReady) return;

    startAnalysis('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', {
      depth: 20,
      numVariations: 3,
    });
  };

  return (
    <div>
      <button onClick={analyzePosition} disabled={!isReady || isAnalyzing}>
        Start Analysis
      </button>
      <button onClick={stopAnalysis} disabled={!isAnalyzing}>
        Stop Analysis
      </button>
      <div>
        <span>Ready: {isReady.toString()}</span>
        <span> | Analyzing: {isAnalyzing.toString()}</span>
      </div>

      <div>
        <h4>Current Best Results:</h4>
        {currentResults.map((result) => (
          <div key={`${result.depth}-${result.multipv || 1}`}>
            <strong>Variation {result.multipv || 1}:</strong>
            Depth {result.depth}, Score: {result.score} {result.scoreType}, PV:{' '}
            {result.pv.slice(0, 5).join(' ')}
          </div>
        ))}
      </div>

      <div>
        <h4>Analysis Stream ({analysisHistory.length} updates):</h4>
        <div style={{ maxHeight: 200, overflow: 'auto' }}>
          {analysisHistory.slice(-10).map((result, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
              D{result.depth}: {result.score}
              {result.scoreType} - {result.pv.slice(0, 3).join(' ')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
