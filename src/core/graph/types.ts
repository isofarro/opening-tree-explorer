import type { FenString } from '../types';

export type MoveEdge = {
  move: string;
  seq: number; // For ordering of moves on a position
  // Add move properties here
  toFen: FenString;
};

export type PositionNode = {
  // Add position properties here
  moves: MoveEdge[];
};

export type PositionNodeMap = Record<FenString, PositionNode>;
