import './App.css';

import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

import { ExplorerPane } from '~/features/explorer/components/ExplorerPane';
import { OpeningTreeProvider } from '~/features/opening-trees/providers/OpeningTreeProvider';
import { START_POSITION_FEN } from '~/core/constants';
const FEN_CLOSED_RUY_LOPEZ = 'r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 b - -';
const DEFAULT_TREE = 'iccf';

export const App = () => {
  return (
    <div className="App">
      <OpeningTreeProvider>
        <ExplorerPane tree={DEFAULT_TREE} position={START_POSITION_FEN} />
      </OpeningTreeProvider>
    </div>
  );
};
