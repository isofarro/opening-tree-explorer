import type { OpeningTreePosition } from '../../../api/types';

type PositionTableProps = {
  treePos: OpeningTreePosition;
  onSelectMove?: (move: string) => void;
  moveNum?: number;
};

export const PositionTable = ({ treePos, onSelectMove, moveNum = 1 }: PositionTableProps) => {
  const isWhiteToMove = treePos.fen.split(' ')[1] === 'w';

  return (
    <table cellPadding={4}>
      <thead>
        <tr>
          <th scope="column">Move</th>
          <th scope="column">Games</th>
          <th scope="column">W/D/L</th>
          <th scope="column">Rating</th>
          <th scope="column">Perf</th>
          <th scope="column">Last Played</th>
        </tr>
      </thead>
      <tbody>
        {treePos.moves.map((move) => (
          <tr key={move.move}>
            <td align="left">
              <a
                href="#"
                onClick={(e) => {
                  onSelectMove?.(move.move);
                  e.preventDefault();
                }}
              >
                {isWhiteToMove ? `${moveNum}.` : `${moveNum}…`} {move.move}
              </a>
            </td>
            <td align="right">{move.totalGames}</td>
            <td align="right">
              {isWhiteToMove
                ? `${move.whiteWins} / ${move.draws} / ${move.blackWins}`
                : `${move.blackWins} / ${move.draws} / ${move.whiteWins}`}
            </td>
            <td align="center">{move.rating}</td>
            <td align="right">
              {move.performance > move.rating && '+'}
              {move.performance - move.rating}
            </td>
            <td>{move.lastPlayedDate}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
