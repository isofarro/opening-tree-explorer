import type { FenString } from '../types';
import type { MoveEdge, PositionNodeMap } from './types';

export class ChessGraph {
  nodes: PositionNodeMap;

  constructor() {
    this.nodes = {};
  }

  // addPosition(fen: FenString) {
  //   if (!this.nodes[fen]) {
  //     this.nodes[fen] = { moves: [] };
  //   }
  //   return this;
  // }

  addMove(fromFen: FenString, moveEdge: MoveEdge) {
    if (fromFen in this.nodes) {
      this.nodes[fromFen].moves.push(moveEdge);
    } else {
      this.nodes[fromFen] = { moves: [moveEdge] };
    }
    return this;
  }
}
