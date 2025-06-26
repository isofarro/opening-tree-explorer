import React from 'react';

type MovesProps = {
  moves: Array<{ move: string; fen: string }>;
  onMoveClick: (fen: string) => void;
  moveNum?: number;
};

export const Moves: React.FC<MovesProps> = ({ moves, onMoveClick, moveNum = 1 }) => {
  const isFirstMoveBlack = moves[0] && !moves[0].fen.includes(' b ');
  const firstMoveOffset = isFirstMoveBlack ? 1 : 0;
  return (
    <div className="moves-list" style={{ padding: '10px' }}>
      {moves.length > 0 && isFirstMoveBlack && (
        <span style={{ marginRight: '4px' }}>{moveNum}...</span>
      )}
      {moves.map((move, index) => {
        const isWhiteMove = move.fen.includes(' b ');
        const currentMoveNum = moveNum + Math.floor((index + (firstMoveOffset)) / 2);
        const showMoveNumber = isWhiteMove;

        return (
          <React.Fragment key={index}>
            {showMoveNumber && (
              <span style={{ marginRight: '4px' }}>
                {currentMoveNum}
                {index === 0 && !isWhiteMove ? '...' : '.'}
              </span>
            )}
            <span
              style={{ marginRight: '8px', cursor: 'pointer' }}
              onClick={() => onMoveClick(move.fen)}
            >
              {move.move}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};
