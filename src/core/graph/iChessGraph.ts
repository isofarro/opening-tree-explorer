import type { FenString } from '~/core/types';
import type { Move, PositionNode } from './types';

export interface IChessGraph {
  addMove(fromFen: FenString, move: Move): void;
  findPosition(fen: FenString): PositionNode | undefined;
}

export interface IChessMoveGraph extends IChessGraph {
  getMovePath(): Move[];
}
