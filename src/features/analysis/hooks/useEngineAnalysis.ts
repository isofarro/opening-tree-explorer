import { useQuery } from '@tanstack/react-query';
import type { FenString } from '~/core/types';
import { Api } from '~/api';

export const useEngineAnalysis = (fen: FenString) => {
  return useQuery({
    queryKey: ['engineAnalysis', fen],
    queryFn: () => Api.analysis.getAnalysisByFen(fen),
    enabled: !!fen,
  });
};
