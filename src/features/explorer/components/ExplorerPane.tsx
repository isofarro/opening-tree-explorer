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
import { createChessFromFen } from '~/features/explorer/lib/fen';
import { EngineAnalysis } from '~/features/engine-analysis/components/EngineAnalysis';

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
  const graphRef = useRef(new ChessMoveGraph());
  const apiRef = useRef<ChessgroundApi | undefined>(undefined);
  const { trees } = useOpeningTree();

  const [currentFen, setCurrentFen] = useState<FenString>(position);
  const [selectedTree, setSelectedTree] = useState<string>(tree);

  // Find the selected tree object
  const selectedTreeObj = trees.find((t) => t.name === selectedTree) || undefined;
  const { makeMove, currentPos, setPosition } = useTree(selectedTreeObj, position);

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
    // Keep current position and just update the tree data
    setSelectedTree(newTree);
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
    graphRef.current.addMove(currentFen, { move, toFen: newFen });

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

  return (
    <div className="flex flex-row h-2/3 mt-15">
      <div className="w-[600px]">
        <Chessground width={560} height={560} ref={apiRef} config={boardConfig} />
        <div>
          {graphRef.current.getMovePath().map((move, i) => (
            <span key={i}>
              <span className="text-nowrap">
                {getMoveNumStr(i)} {move.move}
              </span>{' '}
            </span>
          ))}
        </div>
      </div>
      <div className="tree-table w-[480px] flex flex-col">
        <div className="flex-[2] border-b border-gray-600 overflow-y-auto">
          <MovePane
            rootFen={position}
            graph={graphRef.current}
            moveNum={moveNum}
            onMoveClick={handleSetPosition}
          />
        </div>
        <EngineAnalysis position={currentFen} />
        <TreeSelector selectedTree={selectedTree} onTreeChange={handleTreeChange} />
        {currentPos !== undefined && (
          <div className="flex-[3] overflow-y-auto">
            <PositionTable
              treePos={{
                ...currentPos,
                moveNumber: currentMoveNum,
              }}
              onSelectMove={handleMove}
            />
          </div>
        )}
      </div>
    </div>
  );
};
