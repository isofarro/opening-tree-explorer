import React from 'react';

type MovesProps = {
  moves: Array<{ move: string; fen: string }>;
  onMoveClick: (fen: string) => void;
  moveNum?: number;
};

export const Moves: React.FC<MovesProps> = ({ moves, onMoveClick, moveNum = 1 }) => {
  return (
    <div className="moves-list" style={{ padding: '10px' }}>
      {moves.map((move, index) => {
        const isWhiteMove = move.fen.includes(' b ');
        const showMoveNumber = isWhiteMove || index === 0;
        const firstMoveIsBlack = moves[0] && !moves[0].fen.includes(' b ');
        const adjustedIndex = firstMoveIsBlack ? index + 1 : index;
        const currentMoveNum = moveNum + Math.floor(adjustedIndex / 2);

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
