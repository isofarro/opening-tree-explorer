import { useCallback, useEffect, useRef, useState } from 'react';
import type { FenString } from '../../../core/types';
import type { OpeningTree, OpeningTreePosition } from '../../../api/types';
import { Api } from '../../../api';

type UseTreeProps = {
  currentPos: OpeningTreePosition | undefined;
  makeMove: (move: string) => boolean;
  setPosition: (fen: FenString) => boolean;
};

export const useTree = (tree: OpeningTree | undefined, startFen: FenString): UseTreeProps => {
  const [currentFen, setCurrentFen] = useState<FenString>(startFen);
  const [currentPos, setCurrentPos] = useState<OpeningTreePosition | undefined>(undefined);

  const positionCache = useRef<Map<string, OpeningTreePosition>>(new Map());
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
      if (tree === undefined) {
        return;
      }

      // Create cache key using both tree name and fen
      const cacheKey = `${tree.name}-${newFen}`;

      // Check if position is in cache
      const cachedPosition = positionCache.current.get(cacheKey);
      if (cachedPosition) {
        updatePosition(cachedPosition, newFen, 'Cache hit');
        return;
      }

      // Check if we're already fetching this position
      if (fetchingRef.current.has(cacheKey)) {
        console.log('Already fetching:', cacheKey);
        return;
      }

      // Mark as fetching
      fetchingRef.current.add(cacheKey);

      try {
        // Fetch from server if not in cache
        const treePosition = await Api.openingTrees.getPositionByFen(tree, newFen);
        positionCache.current.set(cacheKey, treePosition);
        updatePosition(treePosition, newFen, 'getPositionByFen');
      } finally {
        // Remove from fetching set when done
        fetchingRef.current.delete(cacheKey);
      }
    },
    [tree, updatePosition]
  );

  useEffect(() => {
    if (tree === undefined) {
      return;
    }
    console.log('[USEEFFECT] fetchPosition', tree);
    fetchPosition(currentFen);
  }, [currentFen, tree]);

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
