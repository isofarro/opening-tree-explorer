import { useCallback, useEffect, useRef, useState } from 'react';

import Chessground, {
  type Api as ChessgroundApi,
} from '../../../third-party/react-chessground/Chessground';
import { Chess } from 'chess.ts';

import { Api } from '../../../api';
import type { OpeningTreePosition } from '../../../api/types';

// import { START_POSITION_FEN } from '../../../core/constants';
import { PositionTable } from './PositionTable';
import type { FenString } from '../../../core/types';
import { START_POSITION_FEN } from '../../../core/constants';
import { useTree } from '../hooks/useTree';

type ExplorerPaneProps = {
  tree: string;
  position?: FenString;
};

const createChessFromFen = (fen: FenString): Chess => {
  return new Chess(fen + ' 0 1');
};

export const ExplorerPane = ({
  tree = 'twic-2025',
  position = START_POSITION_FEN,
}: ExplorerPaneProps) => {
  const gameRef = useRef(createChessFromFen(position));
  const apiRef = useRef<ChessgroundApi | undefined>(undefined);
  const { makeMove, currentFen, currentPos } = useTree(tree, position);

  useEffect(() => {
    if (apiRef.current) {
      apiRef.current.set({ fen: currentFen });
    }
  }, [apiRef.current, currentFen]);

  const handleMove = (move: string) => {
    const game = gameRef.current;
    const madeMove = game.move(move);
    if (madeMove === null) {
      console.warn("Move not found in current position:", move);
      return;
    }

    makeMove(move);
  };

  return (
    <div className="explorer-pane" style={{ display: 'flex', flexDirection: 'row' }}>
      <div className="board-container" style={{ width: '600px' }}>
        <Chessground width={560} height={560} ref={apiRef} />
      </div>
      <div className="tree-table" style={{ width: '512px', height: '560px', overflowY: 'auto' }}>
        {currentPos !== undefined && <PositionTable treePos={currentPos} onSelectMove={handleMove} />}
      </div>
    </div>
  );
};
