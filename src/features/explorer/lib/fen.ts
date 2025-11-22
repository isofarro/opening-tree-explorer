import { Chess } from 'chess.ts';
import type { FenString } from '~/core/types';

export const createChessFromFen = (fen: FenString): Chess => {
  const hasCounters = fen.trim().split(/\s+/).length > 4;
  return new Chess(hasCounters ? fen : `${fen} 0 1`);
};

export const normalizeFen = (fen: FenString): FenString => {
  const parts = fen
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  if (parts.length < 4) {
    throw new Error(`Invalid FEN string: insufficient parts - ${fen}`);
  }

  const [piecePlacement, activeColor, castlingRights, enPassantTarget] = parts;
  const ep = normaliseEnPassant(enPassantTarget, piecePlacement);
  return `${piecePlacement} ${activeColor} ${castlingRights} ${ep}` as FenString;
};

const normaliseEnPassant = (enPassantTarget: string, piecePlacement: string): string => {
  if (enPassantTarget === '-') return enPassantTarget;
  if (!/^[a-h][36]$/.test(enPassantTarget)) return enPassantTarget;

  const fileIdx = enPassantTarget.charCodeAt(0) - 97;
  const rankChar = enPassantTarget[1];
  const isRank3 = rankChar === '3';
  const ranks = piecePlacement.split('/');
  const checkRankIdx = isRank3 ? 8 - 4 : 8 - 5;
  const rankStr = ranks[checkRankIdx] || '';

  const expanded = expandFenRank(rankStr);

  const pawnChar = isRank3 ? 'p' : 'P';
  const leftIdx = fileIdx - 1;
  const rightIdx = fileIdx + 1;
  const leftOk = leftIdx >= 0 && expanded[leftIdx] === pawnChar;
  const rightOk = rightIdx <= 7 && expanded[rightIdx] === pawnChar;

  if (!leftOk && !rightOk) {
    return '-';
  }

  return enPassantTarget;
};

const expandFenRank = (rankStr: string): string => {
  const joined = rankStr
    .split('')
    .map((ch) => (ch >= '1' && ch <= '8' ? ' '.repeat(Number(ch)) : ch))
    .join('');
  return joined.padEnd(8, ' ').slice(0, 8);
};
