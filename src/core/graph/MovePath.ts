import { START_POSITION_FEN } from '~core/constants';
import type { FenString } from '~core/types';
import type { Move } from './types';

export class MovePath {
  startFen: FenString;
  firstMoveIsBlack: boolean;
  path: Move[];
  moveIdx: number;

  constructor(startFen: FenString = START_POSITION_FEN) {
    this.startFen = startFen;
    this.firstMoveIsBlack = startFen.includes(' b ');

    this.path = [];
    this.moveIdx = 0;
  }

  addMove(fromFen: FenString, move: Move) {
    // Find the move with a toFen that matches the fromFen

    // The main usecase is it's the last move
    if (this.path.length === 0 || this.path[this.path.length - 1].toFen === fromFen) {
      this.path.push(move);
      return;
    }

    // Search the movePath for the move
    const moveIdx = this.path.findIndex((move) => move.toFen === fromFen);
    if (moveIdx > -1) {
      // Remove moves after moveIdx and add in the new move
      this.path.splice(moveIdx + 1);
      this.path.push(move);
      return;
    }

    // TODO: use the graph to find the move, and then backtrack
    throw new Error(`Move not found in movePath`);
  }
}
