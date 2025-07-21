import type { JSX } from 'react';
import type { FenString } from '../../../core/types';
import type { IChessGraph } from '../../../core/graph/iChessGraph';

type MovePaneProps = {
  rootFen: FenString;
  graph: IChessGraph;
  moveNum: number;
  onMoveClick: (fen: string) => void;
};

export const MovePane = ({ rootFen, graph, moveNum, onMoveClick }: MovePaneProps) => {
  const renderMoves = (
    fen: FenString,
    currentMoveNum: number,
    isFirstMove = false
  ): JSX.Element | null => {
    const position = graph.findPosition(fen);
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
        <span className={`move ${isFirstMove ? 'ml-0' : 'ml-2'}`}>
          {moveNumStr}
          <span
            className="ml-0 cursor-pointer whitespace-nowrap"
            onClick={() => onMoveClick(firstMove.toFen)}
          >
            {firstMove.move}
          </span>
        </span>
        {variations.length > 0 && (
          <span className="variations ml-2">
            (
            {variations.map((variation, index) => (
              <span className="variation" key={variation.move}>
                {isWhiteMove ? `${currentMoveNum}. ` : `${currentMoveNum}… `}
                <span
                  className="cursor-pointer whitespace-nowrap"
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
