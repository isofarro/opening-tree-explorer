import type { JSX } from 'react';
import type { FenString } from '~/core/types';
import type { IChessMoveGraph } from '~/core/graph/iChessGraph';

type MovePaneProps = {
  rootFen: FenString;
  graph: IChessMoveGraph;
  moveNum: number;
  currentFen: FenString;
  onMoveClick: (fen: string) => void;
};

export const MovePane = ({ rootFen, graph, moveNum, currentFen, onMoveClick }: MovePaneProps) => {
  // Base box for every SAN badge. Padding is kept intentionally smaller than before
  // (px-1.5 = 6 px each side) so the whitespace inside a badge is generous around the
  // glyphs, but no longer so large that it creates a visible extra gap between
  // consecutive move badges. display:inline-block + rounded-md are still applied
  // to every badge unconditionally so toggling highlight never reflows.
  const baseBoxCls = 'cursor-pointer whitespace-nowrap inline-block rounded-md px-1.5 py-[2px]';
  const highlightBgCls = 'bg-indigo-100 text-indigo-900 dark:bg-indigo-200 dark:text-slate-900';

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
        : '';

    const firstIsCurrent = firstMove.toFen === currentFen;

    return (
      <>
        <span className={`move ${isFirstMove ? 'ml-0' : 'ml-0.5'}`}>
          {moveNumStr}
          <span
            className={`ml-0 ${baseBoxCls} ${firstIsCurrent ? highlightBgCls : ''}`}
            onClick={() => onMoveClick(firstMove.toFen)}
          >
            {firstMove.move}
          </span>
        </span>
        {variations.length > 0 && (
          <span className="variations ml-2">
            (
            {variations.map((variation, index) => {
              const vIsCurrent = variation.toFen === currentFen;
              return (
                <span className="variation" key={variation.move}>
                  {isWhiteMove ? `${currentMoveNum}. ` : `${currentMoveNum}… `}
                  <span
                    className={`${baseBoxCls} ${vIsCurrent ? highlightBgCls : ''}`}
                    onClick={() => onMoveClick(variation.toFen)}
                  >
                    {variation.move}
                  </span>{' '}
                  {renderMoves(variation.toFen, isWhiteMove ? currentMoveNum : currentMoveNum + 1)}
                  {index < variations.length - 1 && '; '}
                </span>
              );
            })}
            ){' '}
          </span>
        )}
        {renderMoves(firstMove.toFen, isWhiteMove ? currentMoveNum : currentMoveNum + 1, false)}
      </>
    );
  };

  return <div className="move-pane">{renderMoves(rootFen, moveNum, true)}</div>;
};
