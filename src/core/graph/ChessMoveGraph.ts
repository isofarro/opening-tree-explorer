import { START_POSITION_FEN } from '../constants';
import type { FenString } from '../types';
import { ChessGraph } from './ChessGraph';
import type { IChessMoveGraph } from './iChessGraph';
import { MovePath } from './MovePath';
import type { Move } from './types';

export class ChessMoveGraph implements IChessMoveGraph {
  graph: ChessGraph; // The graph of positions and moves
  moves: MovePath; // The path through the graph

  constructor(startFen: FenString = START_POSITION_FEN) {
    this.graph = new ChessGraph();
    this.moves = new MovePath(startFen);
  }

  addMove(fromFen: FenString, move: Move) {
    this.graph.addMove(fromFen, move);
    this.moves.addMove(fromFen, move);
  }

  findPosition(fen: FenString) {
    return this.graph.findPosition(fen);
  }

  getMovePath(): Move[] {
    return this.moves.path;
  }
}
