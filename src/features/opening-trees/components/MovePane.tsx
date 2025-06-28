import type { JSX } from 'react';
import type { ChessGraph } from '../../../core/graph/ChessGraph';
import type { FenString } from '../../../core/types';

type MovePaneProps = {
  rootFen: FenString;
  graph: ChessGraph;
  moveNum: number;
};

export const MovePane = ({ rootFen, graph, moveNum }: MovePaneProps) => {
  const renderMoves = (fen: FenString, currentMoveNum: number): JSX.Element | null => {
    const position = graph.nodes[fen];
    if (!position || position.moves.length === 0) {
      return null;
    }

    const firstMove = position.moves[0];
    const isWhiteMove = fen.includes(' w ');
    const moveNumStr = isWhiteMove
      ? `${currentMoveNum}.`
      : fen === rootFen
        ? `${currentMoveNum}…`
        : '';

    return (
      <>
        <span className="move">
          {moveNumStr} {firstMove.move}
        </span>{' '}
        {renderMoves(firstMove.toFen, isWhiteMove ? currentMoveNum : currentMoveNum + 1)}
      </>
    );
  };

  return <div className="move-pane">{renderMoves(rootFen, moveNum)}</div>;
};
