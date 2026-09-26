import type { FenString } from '~/core/types';
import { useEngineAnalysis } from '../hooks/useEngineAnalysis';

type EngineAnalysisProps = {
  position: FenString;
};

const formatScore = (score: number, mate: number) => {
  if (mate !== 0) {
    return mate > 0 ? `+M${mate}` : `-M${Math.abs(mate)}`;
  }
  const scoreVal = score / 100;
  const sign = scoreVal > 0 ? '+' : '';
  return `${sign}${scoreVal.toFixed(2)}`;
};

export const EngineAnalysis = ({ position }: EngineAnalysisProps) => {
  const { data: analysisData, isLoading, error } = useEngineAnalysis(position);

  if (isLoading) {
    return (
      <div className="p-2 text-sm text-[var(--color-on-surface-subtle)]">Loading analysis...</div>
    );
  }

  if (error) {
    return <div className="p-2 text-sm text-red-600">Error loading analysis</div>;
  }

  if (!analysisData || analysisData.length === 0) {
    return (
      <div className="p-2 text-sm text-[var(--color-on-surface-subtle)]">No analysis available</div>
    );
  }

  return (
    <div className="border-b border-[var(--color-border)]">
      <div className="grid grid-cols-2 text-sm">
        {analysisData.map((item, index) => (
          <div
            key={index}
            className={`grid grid-cols-[1fr_4rem_6rem] items-center gap-2 px-2 py-1 hover:bg-[var(--color-hover)] ${
              index % 2 === 0 ? 'border-r border-[var(--color-border)]' : ''
            } ${index >= 2 ? 'border-t border-[var(--color-border)]' : ''}`}
          >
            <span className="text-[var(--color-on-surface-subtle)] truncate" title={item.engine}>
              {item.engine}
            </span>
            <span className="text-[var(--color-on-surface-muted)] font-mono text-center">
              {item.bestMove}
            </span>
            <span className="text-[var(--color-on-surface)] text-right font-mono whitespace-nowrap">
              {formatScore(item.score, item.mate)}
              <span className="text-[var(--color-on-surface-subtle)]">/{item.depth}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
