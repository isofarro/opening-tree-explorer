import { useEffect, useRef, useState } from 'react';

import { Chess } from 'chess.ts';
import { ChessGraph } from '../../../core/graph/ChessGraph';
import Chessground, {
  type Api as ChessgroundApi,
  type Config as ChessgroundConfig,
} from '../../../third-party/react-chessground/Chessground';
import type { Key } from 'chessground/types';

import type { FenString } from '../../../core/types';
import { useTree } from '../hooks/useTree';
import { PositionTable } from './PositionTable';
import { START_POSITION_FEN } from '../../../core/constants';
import type { TreeMove } from '../types';
import { MovePane } from './MovePane';
import { TreeSelector } from './TreeSelector';

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
  moveNum?: number;
};

const createChessFromFen = (fen: FenString): Chess => {
  // If FEN already has move counters, use it as is, otherwise append them
  const hasCounters = fen.split(' ').length > 4;
  return new Chess(hasCounters ? fen : fen + ' 0 1');
};

export const ExplorerPane = ({
  tree = 'twic-2025',
  position = START_POSITION_FEN,
  moveNum = 1,
}: ExplorerPaneProps) => {
  const gameRef = useRef(createChessFromFen(position));
  const graphRef = useRef(new ChessGraph());
  const apiRef = useRef<ChessgroundApi | undefined>(undefined);
  const hasInitialized = useRef(false);

  const [currentFen, setCurrentFen] = useState<FenString>(position);
  const [moves, setMoves] = useState<TreeMove[]>([]);
  const [selectedTree, setSelectedTree] = useState<string>(tree);
  const { makeMove, currentPos, setPosition } = useTree(selectedTree, position);

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

  const handleTreeChange = (newTree: string) => {
    setSelectedTree(newTree);
    // Keep current position and just update the tree data
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

    // Add the move to the graph
    graphRef.current.addMove(currentFen, {
      move,
      seq: 1,
      toFen: newFen,
    });

    // Add the move and its FEN to the moves array with moveNum string
    setMoves((prevMoves) => {
      const isWhiteMove = newFen.includes(' b ');
      const isFirstBlackMove = prevMoves.length === 0 && !isWhiteMove;
      const prevMoveWasBlack =
        prevMoves.length > 0 && !prevMoves[prevMoves.length - 1].fen.includes(' b ');
      const currentMoveNum =
        moveNum + Math.floor(prevMoves.length / 2) + (isWhiteMove && prevMoveWasBlack ? 1 : 0);
      const moveNumStr =
        isWhiteMove || isFirstBlackMove ? `${currentMoveNum}${isFirstBlackMove ? '…' : '.'}` : '';
      return [...prevMoves, { move, fen: newFen, moveNumStr }];
    });

    // Update the position tree.
    makeMove(move);
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

  const isBlackFirstMove = position.split(' ')[1] === 'b';
  const isWhiteMove = currentPos?.fen.split(' ')[1] === 'w';
  const movesMade = Math.floor(moves.length / 2);
  const blackFirstMoveOffset = isBlackFirstMove && isWhiteMove ? 1 : 0;
  const currentMoveNum = moveNum + movesMade + blackFirstMoveOffset;

  return (
    <div className="explorer-pane" style={{ display: 'flex', flexDirection: 'row' }}>
      <div className="board-container" style={{ width: '600px' }}>
        <Chessground width={560} height={560} ref={apiRef} config={boardConfig} />
      </div>
      <div
        className="tree-table"
        style={{ width: '480px', height: '560px', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ flex: 1, borderBottom: '1px solid #999', overflowY: 'auto' }}>
          <MovePane
            rootFen={position}
            graph={graphRef.current}
            moveNum={moveNum}
            onMoveClick={handleSetPosition}
          />
        </div>
        <TreeSelector selectedTree={selectedTree} onTreeChange={handleTreeChange} />
        {currentPos !== undefined && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <PositionTable
              treePos={currentPos}
              onSelectMove={handleMove}
              moveNum={currentMoveNum}
            />
          </div>
        )}
      </div>
    </div>
  );
};
