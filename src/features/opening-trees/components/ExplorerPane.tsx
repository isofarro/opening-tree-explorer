import { useEffect, useRef, useState } from 'react';

import { Chess } from 'chess.ts';
import Chessground, {
  type Api as ChessgroundApi,
  type Config as ChessgroundConfig,
} from '../../../third-party/react-chessground/Chessground';
import type { Key } from 'chessground/types';

import type { FenString } from '../../../core/types';
import { useTree } from '../hooks/useTree';
import { PositionTable } from './PositionTable';
import { Moves } from './Moves';
import { START_POSITION_FEN } from '../../../core/constants';

function toDests(chess: Chess): Map<Key, Key[]> {
  const dests = new Map();
  chess.moves({ verbose: true }).forEach((move) => {
    const from = move.from;
    const to = move.to;
    const moves = dests.get(from);
    if (moves) {
      moves.push(to);
    } else {
      dests.set(from, [to]);
    }
  });
  return dests;
}

type ExplorerPaneProps = {
  tree: string;
  position?: FenString;
};

const createChessFromFen = (fen: FenString): Chess => {
  // If FEN already has move counters, use it as is, otherwise append them
  const hasCounters = fen.split(' ').length > 4;
  return new Chess(hasCounters ? fen : fen + ' 0 1');
};

export const ExplorerPane = ({
  tree = 'twic-2025',
  position = START_POSITION_FEN,
}: ExplorerPaneProps) => {
  const gameRef = useRef(createChessFromFen(position));
  const apiRef = useRef<ChessgroundApi | undefined>(undefined);

  const [currentFen, setCurrentFen] = useState<FenString>(position);
  const [moves, setMoves] = useState<Array<{ move: string; fen: string }>>([]);
  const { makeMove, currentPos, setPosition } = useTree(tree, position);

  useEffect(() => {
    if (apiRef.current) {
      apiRef.current.set({ fen: currentFen });
    }
  }, [apiRef.current, currentFen]);

  const handleSetPosition = (fen: FenString) => {
    gameRef.current = createChessFromFen(fen);
    setCurrentFen(fen);
    setPosition(fen);
  };

  const handleMove = (move: string) => {
    const game = gameRef.current;
    const madeMove = game.move(move);
    if (madeMove === null) {
      console.warn('Move not found in current position:', move);
      return;
    }

    // Update the current position
    const newFen = game.fen();
    setCurrentFen(newFen);

    // Add the move and its FEN to the moves array
    setMoves((prevMoves) => [...prevMoves, { move, fen: newFen }]);

    // Update the position tree.
    const isInTree = makeMove(move);
  };

  const boardConfig: ChessgroundConfig = {
    movable: {
      free: false,
      color: 'both',
      dests: toDests(gameRef.current),
      events: {
        after: (orig: Key, dest: Key) => {
          const game = gameRef.current;
          const move = game.move({ from: orig, to: dest }, { dry_run: true });
          move && handleMove(move.san);
        },
      },
    },
    draggable: {
      showGhost: true,
    },
  };

  return (
    <div className="explorer-pane" style={{ display: 'flex', flexDirection: 'row' }}>
      <div className="board-container" style={{ width: '600px' }}>
        <Chessground width={560} height={560} ref={apiRef} config={boardConfig} />
        <Moves moves={moves} onMoveClick={handleSetPosition} />
      </div>
      <div className="tree-table" style={{ width: '512px', height: '560px', overflowY: 'auto' }}>
        {currentPos !== undefined && (
          <PositionTable treePos={currentPos} onSelectMove={handleMove} />
        )}
      </div>
    </div>
  );
};
