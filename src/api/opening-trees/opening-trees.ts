import type { FenString } from '../../core/types';
import { MicroServices } from '../services';
import { ApiClient } from '../client';
import type { OpeningTree, OpeningTreePosition, OpeningTreePositionResponse } from './types';
import { transformToOpeningTreePosition } from './transformers';

const getOpeningTrees = async () => {
    return await ApiClient.get<OpeningTree>(MicroServices.OPENING_TREES, '/');
};

const getPositionByFen = async (tree: string, fen: FenString): Promise<OpeningTreePosition> => {
    const encodedFen = encodeURIComponent(fen);
    const response = await ApiClient.get<OpeningTreePositionResponse>(MicroServices.OPENING_TREES, `/${tree}/${encodedFen}`);
    return transformToOpeningTreePosition(response);
};

export const openingTrees = {
    getOpeningTrees,
    getPositionByFen,
};
