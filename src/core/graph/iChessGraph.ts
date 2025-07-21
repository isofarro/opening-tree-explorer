import type { FenString } from '../types';
import type { Move, PositionNode } from './types';

export interface IChessGraph {
  addMove(fromFen: FenString, move: Move): void;
  findPosition(fen: FenString): PositionNode | undefined;
}
