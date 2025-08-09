import type { FenString } from '~/core/types';

export type Move = {
  move: string;
  toFen: string;
};

export type MoveEdge = Move & {
  seq: number; // For ordering of moves on a position
  // Add move properties here
};

export type PositionNode = {
  // Add position properties here
  moves: MoveEdge[];
};

export type PositionNodeMap = Record<FenString, PositionNode>;
