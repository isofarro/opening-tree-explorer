import type { FenString } from '~/core/types';

export type EngineAnalysisData = {
  createdAt: string;
  updatedAt: string;
  fen: FenString;
  engine: string;
  bestMove: string;
  depth: number;
  score: number;
  mate: number;
  time: number;
  bestMoves: string;
};

export type EngineAnalysisResponse = EngineAnalysisData[];
