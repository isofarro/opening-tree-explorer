type WDLBarGraphProps = {
  wins: number;
  draws: number;
  losses: number;
};

export const WDLBarGraph = ({ wins, draws, losses }: WDLBarGraphProps) => {
  const total = wins + draws + losses;

  if (total === 0) {
    return (
      <div className="flex items-center gap-2 w-full justify-center" title="0/0/0">
        <div className="w-16 h-4 shrink-0 rounded border border-[var(--color-border)] bg-[var(--color-bar-empty)]" />
        <span className="w-10 shrink-0 text-right text-xs text-[var(--color-on-surface-subtle)] tabular-nums">
          0%
        </span>
      </div>
    );
  }

  const winPct = (wins / total) * 100;
  const drawPct = (draws / total) * 100;
  const lossPct = 100 - winPct - drawPct;

  const score = (wins + draws * 0.5) / total;
  const scorePctDisplay = Math.round(score * 100);

  const showWin = wins > 0;
  const showDraw = draws > 0;
  const showLoss = losses > 0;

  return (
    <div
      className="flex items-center gap-2 w-full justify-center"
      title={`${wins} / ${draws} / ${losses}`}
    >
      <div
        className="w-16 h-4 shrink-0 rounded overflow-hidden border border-[var(--color-border)]"
        role="img"
        aria-label={`${wins} wins, ${draws} draws, ${losses} losses`}
      >
        <div className="w-full h-full flex flex-nowrap">
          {showWin ? (
            <div className="bg-[var(--color-win)]" style={{ width: `${winPct}%` }} />
          ) : null}
          {showDraw ? (
            <div className="bg-[var(--color-draw)]" style={{ width: `${drawPct}%` }} />
          ) : null}
          {showLoss ? (
            <div className="bg-[var(--color-loss)]" style={{ width: `${lossPct}%` }} />
          ) : null}
        </div>
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium text-[var(--color-on-surface)] tabular-nums">
        {scorePctDisplay}%
      </span>
    </div>
  );
};
