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
  const renderMoves = (fen: FenString, currentMoveNum: number): JSX.Element | null => {
    const position = graph.nodes[fen];
    if (!position || position.moves.length === 0) {
      return null;
    }

    console.log('MovePane', fen, currentMoveNum, JSON.stringify(position.moves));

    const firstMove = position.moves[0];
    const variations = position.moves.slice(1);
    const isWhiteMove = fen.includes(' w ');
    const moveNumStr = isWhiteMove
      ? `${currentMoveNum}. `
      : fen === rootFen
        ? `${currentMoveNum}… `
        : '';

    return (
      <>
        <span className="move">
          {moveNumStr}
          <span
            style={{ marginRight: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => onMoveClick(firstMove.toFen)}
          >
            {firstMove.move}
          </span>
        </span>
        {variations.length > 0 && (
          <span className="variations">
            (
            {variations.map((variation, index) => (
              <>
                {isWhiteMove ? `${currentMoveNum}. ` : `${currentMoveNum}… `}
                <span
                  key={variation.move}
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => onMoveClick(variation.toFen)}
                >
                  {variation.move}
                </span>{' '}
                {renderMoves(variation.toFen, isWhiteMove ? currentMoveNum : currentMoveNum + 1)}
                {index < variations.length - 1 && '; '}
              </>
            ))}
            ){' '}
          </span>
        )}
        {renderMoves(firstMove.toFen, isWhiteMove ? currentMoveNum : currentMoveNum + 1)}
      </>
    );
  };

  return <div className="move-pane">{renderMoves(rootFen, moveNum)}</div>;
};
