import { useEffect, useRef, useState } from 'react';
import Chessground, {
  type Api as ChessgroundApi,
  type Config as ChessgroundConfig,
} from '~/third-party/react-chessground/Chessground';
import type { Key } from 'chessground/types';
import type { FenString } from '~/core/types';
import { DEFAULT_OPENING_TREE_NAME, START_POSITION_FEN } from '~/core/constants';
import { ChessMoveGraph } from '~/core/graph/ChessMoveGraph';
import { useTree } from '~/features/opening-trees/hooks/useTree';
import { PositionTable } from '~/features/opening-trees/components/PositionTable';
import { TreeSelector } from '~/features/opening-trees/components/TreeSelector';
import { useOpeningTree } from '~/features/opening-trees/providers/OpeningTreeProvider';
import { MovePane } from '~/features/move-pane/components/MovePane';
import { toDests } from '~/features/explorer/lib/moves';
import { createChessFromFen, normalizeFen } from '~/features/explorer/lib/fen';
import { EngineAnalysis as CloudAnalysis } from '~/features/analysis/components/EngineAnalysis';
import { EngineAnalysis } from '~/features/engine-analysis/components/EngineAnalysis';
import { useTheme } from '~/core/hooks/useTheme';

type ExplorerPaneProps = {
  tree: string;
  position?: FenString;
  moveNum?: number;
};

export const ExplorerPane = ({
  tree = DEFAULT_OPENING_TREE_NAME,
  position = START_POSITION_FEN,
  moveNum = 1,
}: ExplorerPaneProps) => {
  const gameRef = useRef(createChessFromFen(position));
  const graphRef = useRef(new ChessMoveGraph(position));
  const apiRef = useRef<ChessgroundApi | undefined>(undefined);
  const { trees } = useOpeningTree();
  const { theme, toggleTheme } = useTheme();

  const [currentFen, setCurrentFen] = useState<FenString>(position);
  const [selectedTree, setSelectedTree] = useState<string>(tree);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  const selectedTreeObj = trees.find((t) => t.name === selectedTree) || undefined;
  const { makeMove, currentPos, setPosition, isLoading, fetchError } = useTree(
    selectedTreeObj,
    position
  );

  useEffect(() => {
    if (apiRef.current) {
      apiRef.current.set({ fen: currentFen });
    }
  }, [apiRef.current, currentFen]);

  const handleSetPosition = (fen: FenString) => {
    gameRef.current = createChessFromFen(fen);
    const normalized = normalizeFen(fen);
    setCurrentFen(normalized);
    setPosition(normalized);
  };

  const handleTreeChange = (newTree: string) => {
    setSelectedTree(newTree);
  };

  const handleMove = (move: string) => {
    const game = gameRef.current;
    const madeMove = game.move(move);

    if (madeMove === null) {
      console.warn('Move not found in current position:', move);
      return;
    }

    const newFen = game.fen();
    const normalizedNewFen = normalizeFen(newFen);
    setCurrentFen(normalizedNewFen);

    graphRef.current.addMove(currentFen, { move, toFen: normalizedNewFen });

    // Attempt the opening-tree move through the table's known SAN → FEN mapping
    // first. If this move isn't in the table (e.g. the user just dragged a piece
    // on the board to a move that's not in this opening book, or they're at a
    // position the tree didn't list), still update the useTree hook with the
    // exact FEN so it fetches the new position regardless. Otherwise the
    // PositionTable would stay stuck showing whatever we had before the drag.
    if (!makeMove(move)) {
      setPosition(normalizedNewFen);
    }
  };

  const handleGoBack = () => {
    const path = graphRef.current.getMovePath();
    const prevPathLen = path.length;
    if (prevPathLen === 0) {
      return;
    }

    const prevFen =
      prevPathLen === 1 ? graphRef.current.moves.startFen : path[prevPathLen - 2].toFen;

    // Rewind the linear move path so the notation / MovePane also shortens.
    // The graph (variation database) itself remains append-only - that's fine,
    // the MovePane only renders the linear path.
    graphRef.current.moves.path.pop();

    handleSetPosition(prevFen);
  };

  const boardConfig: ChessgroundConfig = {
    orientation,
    movable: {
      free: false,
      color: 'both',
      dests: toDests(gameRef.current),
      events: {
        after: (orig: Key, dest: Key) => {
          const game = gameRef.current;
          const move = game.move({ from: orig, to: dest }, { dry_run: true });
          if (move) {
            handleMove(move.san);
          }
        },
      },
    },
    draggable: {
      showGhost: true,
    },
  };

  const isBlackFirstMove = position.includes(' b ');
  const pathLen = graphRef.current.getMovePath().length;
  const currentMoveNum = Math.floor(moveNum + (pathLen + (isBlackFirstMove ? 1 : 0)) / 2);

  const getMoveNumStr = (i: number) => {
    if (i === 0 && isBlackFirstMove) {
      return `${moveNum}…`;
    }

    if ((isBlackFirstMove && i % 2 === 1) || (!isBlackFirstMove && i % 2 === 0)) {
      return `${Math.floor(moveNum + (i + 1) / 2)}.`;
    }

    return '';
  };

  const renderOpeningTreeSection = () => {
    if (isLoading) {
      return (
        <div className="flex-[3] overflow-y-auto p-3 text-xs text-[var(--color-on-surface-subtle)]">
          Loading opening book…
        </div>
      );
    }

    if (fetchError) {
      return (
        <div className="flex-[3] overflow-y-auto p-3 text-xs">
          <div className="text-[var(--color-loss)]">Failed to load opening book.</div>
          <div className="text-[var(--color-on-surface-subtle)] mt-1">{fetchError}</div>
          <button
            type="button"
            onClick={handleGoBack}
            disabled={pathLen === 0}
            className="mt-3 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
          >
            ← Back
          </button>
        </div>
      );
    }

    // Not loading, no fetch error - there should be currentPos (since useTree sets
    // currentPos = undefined only while loading, and sets it again on resolve).
    // But defensively render nothing while the hook catches up after a tree change.
    if (currentPos === undefined) {
      return null;
    }

    const hasMoves = currentPos.moves.length > 0;
    if (!hasMoves) {
      return (
        <div className="flex-[3] overflow-y-auto">
          <div className="p-4 flex flex-col items-start gap-3 text-left">
            <div className="text-sm font-medium text-[var(--color-on-surface)]">
              Position not found in opening book
            </div>
            <button
              type="button"
              onClick={handleGoBack}
              disabled={pathLen === 0}
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
            >
              ← Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-[3] overflow-y-auto">
        <PositionTable
          treePos={{
            ...currentPos,
            moveNumber: currentMoveNum,
          }}
          onSelectMove={handleMove}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-row mt-15">
      <div className="w-[600px]">
        <Chessground width={560} height={560} ref={apiRef} config={boardConfig} />
        <div className="mr-8 text-[var(--color-on-surface)]">
          {graphRef.current.getMovePath().map((move, i) => (
            <span key={i}>
              <span className="text-nowrap">
                {getMoveNumStr(i)} {move.move}
              </span>{' '}
            </span>
          ))}
        </div>
        <div className="mr-8">
          <CloudAnalysis position={gameRef.current.fen()} />
        </div>
      </div>
      <div className="tree-table w-[480px] flex flex-col">
        <div className="flex flex-col h-[560px] shrink-0">
          <div className="flex-[2] border-b border-[var(--color-border)] overflow-y-auto">
            <MovePane
              rootFen={position}
              graph={graphRef.current}
              moveNum={moveNum}
              currentFen={currentFen}
              onMoveClick={handleSetPosition}
            />
          </div>
          <TreeSelector selectedTree={selectedTree} onTreeChange={handleTreeChange} />
          {renderOpeningTreeSection()}
        </div>
        <div>
          <EngineAnalysis
            position={gameRef.current.fen()}
            renderHeaderStart={
              <div className="flex flex-row gap-2 items-center">
                <button
                  onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}
                  className="px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-on-surface)] hover:bg-[var(--color-hover)] hover:border-[var(--color-border-strong)] transition-colors"
                >
                  Flip Board
                </button>
                <button
                  onClick={toggleTheme}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  className="px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-on-surface)] hover:bg-[var(--color-hover)] hover:border-[var(--color-border-strong)] transition-colors"
                >
                  {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                </button>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};
