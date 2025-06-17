import { useEffect, useRef, useState } from 'react';

import Chessground, { type Api as ChessgroundApi } from '../../../third-party/react-chessground/Chessground';

import { Api } from '../../../api';
import type { OpeningTreePosition } from '../../../api/types';

// import { START_POSITION_FEN } from '../../../core/constants';
import { PositionTable } from './PositionTable';

const FEN_CLOSED_RUY_LOPEZ = 'r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 b - -';

export const ExplorerPane = () => {
    const [fen, setFen] = useState(FEN_CLOSED_RUY_LOPEZ);
    const apiRef = useRef<ChessgroundApi | undefined>(undefined);
    const [treePos, setTreePos] = useState<OpeningTreePosition | undefined>(undefined)
  
    useEffect(() => {
        window.console.log("[EXPLORER] useEffect fen:", fen);
        Api.openingTrees.getPositionByFen('twic-2025', fen)
            .then((treePos) => {
                console.log('getPositionByFen:', treePos);
                setTreePos(treePos);
            });
        apiRef.current?.set({fen});
    }, [fen]);

    useEffect(() => {
        apiRef.current?.set({fen});
    }, [apiRef.current, fen]);
  
    return (
        <div className="explorer-pane" style={{ display: 'flex', flexDirection: 'row' }}>
            <div className="board-container">
                <Chessground width={560} height={560} ref={apiRef} />
            </div>
            <div className="tree-table">
                {treePos !== undefined && (
                    <PositionTable treePos={treePos} />
                )}
            </div>
        </div>
    );
};
