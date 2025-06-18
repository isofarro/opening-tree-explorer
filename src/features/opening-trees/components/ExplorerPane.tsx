import { useEffect, useRef, useState } from 'react';

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
}

const FEN_CLOSED_RUY_LOPEZ = 'r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 b - -';

const createChessFromFen = (fen: FenString): Chess => {
  return new Chess(fen + ' 0 1');
}

export const ExplorerPane = ({ tree = 'twic-2025', position = FEN_CLOSED_RUY_LOPEZ }: ExplorerPaneProps) => {
  const gameRef = useRef(createChessFromFen(position));
  const apiRef = useRef<ChessgroundApi | undefined>(undefined);
  const [treePos, setTreePos] = useState<OpeningTreePosition | undefined>(undefined);

  useEffect(() => {
    const currentFen = gameRef.current.fen();
    window.console.log('[EXPLORER] useEffect fen:', currentFen);
    Api.openingTrees.getPositionByFen(tree, currentFen).then((treePos) => {
      console.log('getPositionByFen:', treePos);
      setTreePos(treePos);
    });
  }, []);

  useEffect(() => {
    if (apiRef.current) {
      apiRef.current.set({ fen: gameRef.current.fen() });
    }
  }, [apiRef.current]);

  const handleMove = (move: string) => {
    gameRef.current.move(move);
    setTreePos(undefined);
    apiRef.current?.set({ fen: gameRef.current.fen() });
    Api.openingTrees.getPositionByFen(tree, gameRef.current.fen()).then((treePos) => {
      console.log('getPositionByFen:', treePos);
      setTreePos(treePos);
    });
  };

  return (
    <div className="explorer-pane" style={{ display: 'flex', flexDirection: 'row' }}>
      <div className="board-container" style={{ width: '600px' }}>
        <Chessground width={560} height={560} ref={apiRef} />
      </div>
      <div className="tree-table" style={{ width: '480px' }}>
        {treePos !== undefined && <PositionTable treePos={treePos} onSelectMove={handleMove} />}
      </div>
    </div>
  );
};
