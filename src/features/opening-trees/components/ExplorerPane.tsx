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
  const [treePos, setTreePos] = useState<OpeningTreePosition | undefined>(undefined);
  const [currentFen, setCurrentFen] = useState<FenString>(position);
  const lastFetchedFen = useRef<FenString | null>(null);

  useEffect(() => {
    if (apiRef.current) {
      apiRef.current.set({ fen: currentFen });
    }
  }, [apiRef.current, currentFen]);

  const fetchPosition = useCallback(async () => {
    if (lastFetchedFen.current === currentFen) return;
    lastFetchedFen.current = currentFen;
    const treePosition = await Api.openingTrees.getPositionByFen(tree, currentFen);
    console.log('getPositionByFen:', treePosition);
    setTreePos(treePosition);
  }, [currentFen, tree]);

  useEffect(() => {
    fetchPosition();
  }, [fetchPosition]);

  const handleMove = (move: string) => {
    const game = gameRef.current;
    game.move(move);
    const newFen = game.fen();
    setCurrentFen(newFen);
    setTreePos(undefined);
  };

  return (
    <div className="explorer-pane" style={{ display: 'flex', flexDirection: 'row' }}>
      <div className="board-container" style={{ width: '600px' }}>
        <Chessground width={560} height={560} ref={apiRef} />
      </div>
      <div className="tree-table" style={{ width: '512px', height: '560px', overflowY: 'auto' }}>
        {treePos !== undefined && <PositionTable treePos={treePos} onSelectMove={handleMove} />}
      </div>
    </div>
  );
};
