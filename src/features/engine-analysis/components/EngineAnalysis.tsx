import { useState } from 'react';
import { useUciEngine } from '~/core/engine';
import { useStockfish } from '~/core/engine/engines/useStockfish';

export const EngineAnalysis = () => {
  const stockfishEngine = useStockfish();
  const { analyse, stop, isReady } = useUciEngine(stockfishEngine);
  const [isAnalysing, setIsAnalysing] = useState(false);
  
  const analyzePosition = async () => {
    if (!isReady) return;
    setIsAnalysing(true);
    try {
      const results = await analyse('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', {
        depth: 15,
        numVariations: 3
      });
      
      console.log('Analysis results:', results);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalysing(false);
    }
  };
  
  return (
    <div>
      {!isAnalysing ? (
        <button onClick={analyzePosition} disabled={!isReady}>
          Analyze Position
        </button>
      ) : (
        <button onClick={stop}>
          Stop Analysis
        </button>
      )}
      <span>{isAnalysing ? 'Analysing' : `Ready: ${isReady.toString()}`}</span>
    </div>
  );
};