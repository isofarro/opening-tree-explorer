import { Chess } from 'chess.ts';
import type { Key } from 'chessground/types';

export const toDests = (chess: Chess): Map<Key, Key[]> => {
  const dests = new Map();
  chess.moves({ verbose: true }).forEach((move) => {
    const from = move.from;
    const to = move.to;
    const moves = dests.get(from);
    if (moves) {
      moves.push(to);
    } else {
      dests.set(from, [to]);
    }
  });
  return dests;
};
