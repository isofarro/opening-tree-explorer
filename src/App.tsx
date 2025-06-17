import './App.css';

import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

import { ExplorerPane } from './features/opening-trees/components/ExplorerPane';

export const App = () => {
  return (
    <div className="App">
      <ExplorerPane />
    </div>
  );
};
