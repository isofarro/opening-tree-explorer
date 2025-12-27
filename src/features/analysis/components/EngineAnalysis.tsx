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
    return <div className="p-2 text-sm text-gray-500">Loading analysis...</div>;
  }

  if (error) {
    return <div className="p-2 text-sm text-red-600">Error loading analysis</div>;
  }

  if (!analysisData || analysisData.length === 0) {
    return <div className="p-2 text-sm text-gray-500">No analysis available</div>;
  }

  return (
    <div className="border-b border-gray-600">
      <div className="grid grid-cols-2 text-sm">
        {analysisData.map((item, index) => (
          <div
            key={index}
            className={`flex justify-between items-center px-2 py-1 hover:bg-gray-800/50 ${
              index % 2 === 0 ? 'border-r border-gray-700' : ''
            } ${index >= 2 ? 'border-t border-gray-700' : ''}`}
          >
            <span className="text-gray-400 truncate mr-2" title={item.engine}>
              {item.engine}
            </span>
            <span className="text-right font-mono whitespace-nowrap">
              {formatScore(item.score, item.mate)}
              <span className="text-gray-500">/{item.depth}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
