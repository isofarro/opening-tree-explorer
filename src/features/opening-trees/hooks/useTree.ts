import { useCallback, useEffect, useRef, useState } from 'react';
import type { FenString } from '../../../core/types';
import type { OpeningTreePosition } from '../../../api/types';
import { Api } from '../../../api';

type UseTreeProps = {
  currentFen: FenString;
  currentPos: OpeningTreePosition | undefined;
  makeMove: (move: string) => void;
};

export const useTree = (treeName: string, startFen: FenString): UseTreeProps => {
  const [currentFen, setCurrentFen] = useState<FenString>(startFen);
  const [currentPos, setCurrentPos] = useState<OpeningTreePosition | undefined>(undefined);

  const lastFetchedFen = useRef<FenString | null>(null);

  const fetchPosition = useCallback(async (newFen: FenString) => {
    if (lastFetchedFen.current === newFen) return;
    lastFetchedFen.current = newFen;

    const treePosition = await Api.openingTrees.getPositionByFen(treeName, newFen);
    console.log('getPositionByFen:', treePosition);
    setCurrentPos(treePosition);
    setCurrentFen(newFen);
  }, [treeName]);

  useEffect(() => {
    console.log('[USEEFFECT] fetchPosition');
    if (currentFen !== lastFetchedFen.current) {
      fetchPosition(currentFen);
    }
  }, [currentFen, treeName]);

  const makeMove = (move: string) => {
    // Find the move in the current position info
    const toPos = currentPos?.moves.find((m) => m.move === move);
    if (!toPos) {
      console.warn("Move not found in current position:", move);
      return;
    }
    fetchPosition(toPos.fen);
  };

  return {
    currentFen,
    currentPos,
    makeMove,
  };
};
