type WDLBarGraphProps = {
  wins: number;
  draws: number;
  losses: number;
};

export const WDLBarGraph = ({ wins, draws, losses }: WDLBarGraphProps) => {
  const total = wins + draws + losses;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center gap-2" title="0/0/0">
        <div className="w-16 h-4 bg-gray-200 rounded"></div>
        <span className="text-xs text-gray-500">0%</span>
      </div>
    );
  }

  const winPercentage = (wins / total) * 100;
  const drawPercentage = (draws / total) * 100;
  const lossPercentage = (losses / total) * 100;

  // Calculate score: wins = 1 point, draws = 0.5 points
  const score = (wins * 1 + draws * 0.5) / total;
  const scorePercentage = Math.round(score * 100);

  return (
    <div
      className="flex items-center justify-center gap-2"
      title={`${wins} / ${draws} / ${losses}`}
    >
      <div className="w-16 h-4 flex rounded overflow-hidden border border-gray-300">
        {winPercentage > 0 && (
          <div
            className="bg-white border-r border-gray-400"
            style={{ width: `${winPercentage}%` }}
          />
        )}
        {drawPercentage > 0 && (
          <div
            className="bg-gray-500 border-r border-gray-400"
            style={{ width: `${drawPercentage}%` }}
          />
        )}
        {lossPercentage > 0 && (
          <div className="bg-gray-900" style={{ width: `${lossPercentage}%` }} />
        )}
      </div>
      <span className="text-xs font-medium">{scorePercentage}%</span>
    </div>
  );
};
