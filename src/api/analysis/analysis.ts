import type { FenString } from '~/core/types';
import { MicroServices } from '~/api/services';
import { ApiClient } from '~/api/client';
import type { EngineAnalysisResponse } from './types';
import { normalizeFen } from '~/features/explorer/lib/fen';

const getAnalysisByFen = async (fen: FenString): Promise<EngineAnalysisResponse> => {
  const encodedFen = encodeURIComponent(normalizeFen(fen));
  return await ApiClient.get<EngineAnalysisResponse>(
    MicroServices.ANALYSIS,
    `/analysis/${encodedFen}`
  );
};

export const analysis = {
  getAnalysisByFen,
};
