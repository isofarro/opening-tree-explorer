import type { FenString } from '~core/types';
import type { IChessGraph } from './iChessGraph';
import type { Move, PositionNodeMap } from './types';

export class ChessGraph implements IChessGraph {
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

  addMove(fromFen: FenString, move: Move) {
    if (fromFen in this.nodes) {
      const existingMove = this.nodes[fromFen].moves.find(
        (moveEdge) => move.toFen === moveEdge.toFen
      );
      if (!existingMove) {
        this.nodes[fromFen].moves.push({
          ...move,
          seq: this.nodes[fromFen].moves.length,
        });
      }
    } else {
      this.nodes[fromFen] = {
        moves: [
          {
            ...move,
            seq: 1,
          },
        ],
      };
    }
    return this;
  }

  findPosition(fen: FenString) {
    return this.nodes[fen];
  }
}
