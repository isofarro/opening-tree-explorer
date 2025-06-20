import './App.css';

import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

import { ExplorerPane } from './features/opening-trees/components/ExplorerPane';
import { START_POSITION_FEN } from './core/constants';

export const App = () => {
  return (
    <div className="App">
      <ExplorerPane tree="twic-2025" position={START_POSITION_FEN} />
    </div>
  );
};
