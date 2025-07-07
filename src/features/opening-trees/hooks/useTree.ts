import { useCallback, useEffect, useRef, useState } from 'react';
import type { FenString } from '../../../core/types';
import type { OpeningTreePosition } from '../../../api/types';
import { Api } from '../../../api';

type UseTreeProps = {
  currentPos: OpeningTreePosition | undefined;
  makeMove: (move: string) => boolean;
  setPosition: (fen: FenString) => boolean;
};

export const useTree = (treeName: string, startFen: FenString): UseTreeProps => {
  const [currentFen, setCurrentFen] = useState<FenString>(startFen);
  const [currentPos, setCurrentPos] = useState<OpeningTreePosition | undefined>(undefined);

  const positionCache = useRef<Map<FenString, OpeningTreePosition>>(new Map());
  const fetchingRef = useRef<Set<string>>(new Set());

  const updatePosition = useCallback(
    (position: OpeningTreePosition, fen: FenString, source: string) => {
      console.log(`${source}:`, position);
      setCurrentPos(position);
      setCurrentFen(fen);
    },
    []
  );

  const fetchPosition = useCallback(
    async (newFen: FenString) => {
      // Check if position is in cache
      const cachedPosition = positionCache.current.get(newFen);
      if (cachedPosition) {
        updatePosition(cachedPosition, newFen, 'Cache hit');
        return;
      }

      // Create a unique key for this fetch operation
      const fetchKey = `${treeName}-${newFen}`;

      // Check if we're already fetching this position
      if (fetchingRef.current.has(fetchKey)) {
        console.log('Already fetching:', fetchKey);
        return;
      }

      // Mark as fetching
      fetchingRef.current.add(fetchKey);

      try {
        // Fetch from server if not in cache
        const treePosition = await Api.openingTrees.getPositionByFen(treeName, newFen);
        positionCache.current.set(newFen, treePosition);
        updatePosition(treePosition, newFen, 'getPositionByFen');
      } finally {
        // Remove from fetching set when done
        fetchingRef.current.delete(fetchKey);
      }
    },
    [treeName, updatePosition]
  );

  useEffect(() => {
    console.log('[USEEFFECT] fetchPosition');
    fetchPosition(currentFen);
  }, [currentFen, treeName]);

  const makeMove = (move: string): boolean => {
    // Find the move in the current position info
    const toPos = currentPos?.moves.find((m) => m.move === move);
    if (!toPos) {
      return false;
    }
    return setPosition(toPos.fen);
  };

  const setPosition = (fen: FenString): boolean => {
    setCurrentFen(fen);
    return true;
  };

  return {
    currentPos,
    makeMove,
    setPosition,
  };
};
