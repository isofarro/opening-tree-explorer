import './App.css';

import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

import { ExplorerPane } from './features/opening-trees/components/ExplorerPane';
import { START_POSITION_FEN } from './core/constants';
const FEN_CLOSED_RUY_LOPEZ = 'r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 b - -';

export const App = () => {
  return (
    <div className="App">
      <ExplorerPane tree="twic-2025" position={FEN_CLOSED_RUY_LOPEZ} />
    </div>
  );
};
