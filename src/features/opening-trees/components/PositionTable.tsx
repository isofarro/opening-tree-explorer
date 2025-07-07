import type { OpeningTreePosition } from '../../../api/types';
import { WDLBarGraph } from './WDLBarGraph';

type PositionTableProps = {
  treePos: OpeningTreePosition;
  onSelectMove?: (move: string) => void;
  moveNum?: number;
};

export const PositionTable = ({ treePos, onSelectMove, moveNum = 1 }: PositionTableProps) => {
  const isWhiteToMove = treePos.fen.split(' ')[1] === 'w';

  return (
    <table className="text-sm p-2 w-full">
      <thead>
        <tr>
          <th scope="column" className="px-0.5">
            Move
          </th>
          <th scope="column" className="px-0.5">
            Games
          </th>
          <th scope="column" className="px-0.5">
            W/D/L
          </th>
          <th scope="column" className="px-0.5">
            Rating
          </th>
          <th scope="column" className="px-0.5">
            Perf
          </th>
          <th scope="column" className="px-0.5">
            Last Played
          </th>
        </tr>
      </thead>
      <tbody>
        {treePos.moves.map((move) => (
          <tr key={move.move}>
            <td align="left" className="px-0.5">
              <a
                href="#"
                onClick={(e) => {
                  onSelectMove?.(move.move);
                  e.preventDefault();
                }}
              >
                {`${isWhiteToMove ? `${moveNum}.` : `${moveNum}…`} ${move.move}`}
              </a>
            </td>
            <td align="right" className="px-0.5">
              {move.totalGames}
            </td>
            <td align="center" className="px-0.5">
              <WDLBarGraph
                wins={isWhiteToMove ? move.whiteWins : move.blackWins}
                draws={move.draws}
                losses={isWhiteToMove ? move.blackWins : move.whiteWins}
              />
            </td>
            <td align="center" className="px-0.5">
              {move.rating}
            </td>
            <td align="right" className="px-0.5">
              {move.performance > move.rating && '+'}
              {move.performance - move.rating}
            </td>
            <td className="px-0.5">{move.lastPlayedDate}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
