import { useCallback, useEffect, useRef, useState } from 'react';
import type { FenString } from '~/core/types';
import type { OpeningTree, OpeningTreePosition } from '~/api/types';
import { Api } from '~/api';
import { normalizeFen } from '~/features/explorer/lib/fen';

type UseTreeProps = {
  currentPos: OpeningTreePosition | undefined;
  isLoading: boolean;
  fetchError: string | undefined;
  makeMove: (move: string) => boolean;
  setPosition: (fen: FenString) => boolean;
};

export const useTree = (tree: OpeningTree | undefined, startFen: FenString): UseTreeProps => {
  const [currentFen, setCurrentFen] = useState<FenString>(startFen);
  const [currentPos, setCurrentPos] = useState<OpeningTreePosition | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | undefined>(undefined);

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
        setIsLoading(false);
        return;
      }

      const normalizedFen = normalizeFen(newFen);
      const cacheKey = `${tree.name}-${normalizedFen}`;

      // Clear stale position and previous error before resolving new FEN, so the
      // UI never shows results from a different position while loading or if
      // this position turns out to be empty / missing from the opening book.
      setCurrentPos(undefined);
      setFetchError(undefined);
      setIsLoading(true);

      // Check if position is in cache
      const cachedPosition = positionCache.current.get(cacheKey);
      if (cachedPosition) {
        updatePosition(cachedPosition, newFen, 'Cache hit');
        setIsLoading(false);
        return;
      }

      // Check if we're already fetching this position
      if (fetchingRef.current.has(cacheKey)) {
        console.log('Already fetching:', cacheKey);
        return;
      }

      fetchingRef.current.add(cacheKey);

      try {
        const treePosition = await Api.openingTrees.getPositionByFen(tree, normalizedFen);
        positionCache.current.set(cacheKey, treePosition);
        updatePosition(treePosition, normalizedFen, 'getPositionByFen');
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('Failed to fetch opening tree position:', message);
        setFetchError(message);
      } finally {
        fetchingRef.current.delete(cacheKey);
        setIsLoading(false);
      }
    },
    [tree, updatePosition]
  );

  useEffect(() => {
    if (tree === undefined) {
      return;
    }
    console.log('[USEEFFECT] fetchPosition', tree);
    void fetchPosition(currentFen);
  }, [currentFen, tree, fetchPosition]);

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
    isLoading,
    fetchError,
    makeMove,
    setPosition,
  };
};
