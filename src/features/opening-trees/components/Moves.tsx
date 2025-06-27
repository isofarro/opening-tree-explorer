import React from 'react';
import type { TreeMove } from '../types';

type MovesProps = {
  moves: TreeMove[];
  onMoveClick: (fen: string) => void;
};

export const Moves: React.FC<MovesProps> = ({ moves, onMoveClick }) => {
  return (
    <div className="moves-list" style={{ padding: '10px' }}>
      {moves.map((move, index) => (
        <React.Fragment key={index}>
          {move.moveNumStr && <span style={{ marginRight: '4px' }}>{move.moveNumStr}</span>}
          <span
            style={{ marginRight: '8px', cursor: 'pointer' }}
            onClick={() => onMoveClick(move.fen)}
          >
            {move.move}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};
