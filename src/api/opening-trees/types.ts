import type { FenString, SanMove } from '../../core/types';

export type OpeningTree = {
  name: string;
  path: string;
};

export type OpeningTreeMoveResponse = {
  move: SanMove;
  fen: FenString;
  total_games: number;
  white_wins: number;
  draws: number;
  black_wins: number;
  rating: number;
  performance: number;
  last_played_date: string;
  game_ref: string;
};

export type OpeningTreePositionResponse = {
  fen: FenString;
  moves: OpeningTreeMoveResponse[];
};

export type OpeningTreeMove = {
  move: SanMove;
  fen: FenString;
  totalGames: number;
  whiteWins: number;
  draws: number;
  blackWins: number;
  rating: number;
  performance: number;
  lastPlayedDate: string;
  gameRef: string;
};

export type OpeningTreePosition = {
  fen: FenString;
  moves: OpeningTreeMove[];
  moveNumber?: number;
};
