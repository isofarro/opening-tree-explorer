import type { FenString } from '~/core/types';
import { MicroServices } from '~/api/services';
import { ApiClient } from '~/api/client';
import type { OpeningTree, OpeningTreePosition, OpeningTreePositionResponse } from './types';
import { normalizeFen } from '~/features/explorer/lib/fen';
import { transformToOpeningTreePosition } from './transformers';

const getOpeningTrees = async () => {
  return await ApiClient.get<OpeningTree>(MicroServices.OPENING_TREES, '/');
};

const getPositionByFen = async (
  tree: OpeningTree,
  fen: FenString
): Promise<OpeningTreePosition> => {
  const encodedFen = encodeURIComponent(normalizeFen(fen));
  try {
    const response = await ApiClient.get<OpeningTreePositionResponse>(
      tree.path.replace(/\/$/, ''),
      `/${encodedFen}`
    );
    return transformToOpeningTreePosition(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // A 404 from the trees service means this position is simply not present in
    // this opening book at all - that's a normal, expected "no data" case, not a
    // real fetch failure. Treat it identically to a 200 with an empty moves
    // array so the UI renders the friendly "Position not found in opening book"
    // message instead of a red error card.
    if (message.includes('status: 404')) {
      return { fen: normalizeFen(fen), moves: [] };
    }
    throw e;
  }
};

export const openingTrees = {
  getOpeningTrees,
  getPositionByFen,
};
