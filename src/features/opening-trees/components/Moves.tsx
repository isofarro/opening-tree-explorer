import React from 'react';

type MovesProps = {
  moves: Array<{ move: string; fen: string }>;
  onMoveClick: (fen: string) => void;
};

export const Moves: React.FC<MovesProps> = ({ moves, onMoveClick }) => {
  return (
    <div className="moves-list" style={{ padding: '10px' }}>
      {moves.map((move, index) => (
        <span
          key={index}
          style={{ marginRight: '8px', cursor: 'pointer' }}
          onClick={() => onMoveClick(move.fen)}
        >
          {move.move}
        </span>
      ))}
    </div>
  );
};
