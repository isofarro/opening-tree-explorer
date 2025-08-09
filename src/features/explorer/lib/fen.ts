import { Chess } from 'chess.ts';
import type { FenString } from '~/core/types';

export const createChessFromFen = (fen: FenString): Chess => {
  // If FEN already has move counters, use it as is, otherwise append them
  const hasCounters = fen.split(' ').length > 4;
  return new Chess(hasCounters ? fen : fen + ' 0 1');
};
