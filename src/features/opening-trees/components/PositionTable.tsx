import type { OpeningTreePosition } from '~/api/types';
import { WDLBarGraph } from './WDLBarGraph';

type PositionTableProps = {
  treePos: OpeningTreePosition;
  onSelectMove?: (move: string) => void;
  moveNum?: number;
};

const WDL_CELL_PX = '136px';

export const PositionTable = ({ treePos, onSelectMove }: PositionTableProps) => {
  const isWhiteToMove = treePos.fen.split(' ')[1] === 'w';
  const moveNum = treePos.moveNumber || 1;

  return (
    <table className="text-sm p-2 w-full text-[var(--color-on-surface)]">
      <colgroup>
        <col />
        <col />
        <col style={{ width: WDL_CELL_PX, minWidth: WDL_CELL_PX, maxWidth: WDL_CELL_PX }} />
        <col />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr className="text-[var(--color-on-surface-muted)]">
          <th scope="col" className="px-0.5 text-left whitespace-nowrap">
            Move
          </th>
          <th scope="col" className="px-0.5 text-right whitespace-nowrap tabular-nums">
            Games
          </th>
          <th
            scope="col"
            className="px-0.5 text-center whitespace-nowrap"
            style={{ width: WDL_CELL_PX, minWidth: WDL_CELL_PX, maxWidth: WDL_CELL_PX }}
          >
            W/D/L
          </th>
          <th scope="col" className="px-0.5 text-center whitespace-nowrap tabular-nums">
            Rating
          </th>
          <th scope="col" className="px-0.5 text-right whitespace-nowrap tabular-nums">
            Perf
          </th>
          <th scope="col" className="px-0.5 text-left truncate">
            Last Played
          </th>
        </tr>
      </thead>
      <tbody>
        {treePos.moves.map((move) => (
          <tr key={move.move} className="hover:bg-[var(--color-hover)]">
            <td align="left" className="px-0.5 whitespace-nowrap">
              <a
                href="#"
                onClick={(e) => {
                  onSelectMove?.(move.move);
                  e.preventDefault();
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {`${isWhiteToMove ? `${moveNum}.` : `${moveNum}…`} ${move.move}`}
              </a>
            </td>
            <td align="right" className="px-0.5 whitespace-nowrap tabular-nums">
              {move.totalGames}
            </td>
            <td
              align="center"
              className="px-0.5"
              style={{ width: WDL_CELL_PX, minWidth: WDL_CELL_PX, maxWidth: WDL_CELL_PX }}
            >
              <WDLBarGraph wins={move.whiteWins} draws={move.draws} losses={move.blackWins} />
            </td>
            <td align="center" className="px-0.5 whitespace-nowrap tabular-nums">
              {move.rating}
            </td>
            <td align="right" className="px-0.5 whitespace-nowrap tabular-nums">
              {move.performance > move.rating && '+'}
              {move.performance - move.rating}
            </td>
            <td className="px-0.5 whitespace-nowrap text-[var(--color-on-surface-subtle)]">
              {move.lastPlayedDate}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
