import type { OpeningTreePosition } from '../../../api/types';

type PositionTableProps = {
  treePos: OpeningTreePosition;
};

export const PositionTable = ({ treePos }: PositionTableProps) => {
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
            <td align="right">{move.move}</td>
            <td align="right">{move.totalGames}</td>
            <td align="right">
              {move.whiteWins} / {move.draws} / {move.blackWins}
            </td>
            <td align="center">{move.rating}</td>
            <td>{move.performance}</td>
            <td>{move.lastPlayedDate}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
