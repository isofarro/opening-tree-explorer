import type { OpeningTreePosition } from '../../../api/types';

type PositionTableProps = {
  treePos: OpeningTreePosition;
  onSelectMove?: (move: string) => void;
};

export const PositionTable = ({ treePos, onSelectMove }: PositionTableProps) => {
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
            <td align="right">
              <a href="#" onClick={(e) => { onSelectMove?.(move.move); e.preventDefault()}}>
                {move.move}
              </a>
            </td>
            <td align="right">{move.totalGames}</td>
            <td align="right">
              {move.whiteWins} / {move.draws} / {move.blackWins}
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
