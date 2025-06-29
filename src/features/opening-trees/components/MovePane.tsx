import type { JSX } from 'react';
import type { ChessGraph } from '../../../core/graph/ChessGraph';
import type { FenString } from '../../../core/types';

type MovePaneProps = {
  rootFen: FenString;
  graph: ChessGraph;
  moveNum: number;
  onMoveClick: (fen: string) => void;
};

export const MovePane = ({ rootFen, graph, moveNum, onMoveClick }: MovePaneProps) => {
  const renderMoves = (
    fen: FenString,
    currentMoveNum: number,
    isFirstMove = false
  ): JSX.Element | null => {
    const position = graph.nodes[fen];
    if (!position || position.moves.length === 0) {
      return null;
    }

    const firstMove = position.moves[0];
    const variations = position.moves.slice(1);
    const isWhiteMove = fen.includes(' w ');
    const moveNumStr = isWhiteMove
      ? `${currentMoveNum}. `
      : fen === rootFen
        ? `${currentMoveNum}… `
        : ' ';

    return (
      <>
        <span className="move" style={{ marginLeft: isFirstMove ? '0px' : '8px' }}>
          {moveNumStr}
          <span
            style={{ marginLeft: '0px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => onMoveClick(firstMove.toFen)}
          >
            {firstMove.move}
          </span>
        </span>
        {variations.length > 0 && (
          <span className="variations" style={{ marginLeft: '8px' }}>
            (
            {variations.map((variation, index) => (
              <span className="variation" key={variation.move}>
                {isWhiteMove ? `${currentMoveNum}. ` : `${currentMoveNum}… `}
                <span
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => onMoveClick(variation.toFen)}
                >
                  {variation.move}
                </span>{' '}
                {renderMoves(variation.toFen, isWhiteMove ? currentMoveNum : currentMoveNum + 1)}
                {index < variations.length - 1 && '; '}
              </span>
            ))}
            ){' '}
          </span>
        )}
        {renderMoves(firstMove.toFen, isWhiteMove ? currentMoveNum : currentMoveNum + 1, false)}
      </>
    );
  };

  return <div className="move-pane">{renderMoves(rootFen, moveNum, true)}</div>;
};
