import { Board } from '../../board';
import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class ScrambledEggs extends GameFamily {
  static override rules: Rules = 'scrambledeggs';

  static override default(): ScrambledEggs {
    const pos = new this();
    pos.board = Board.scrambledEggs();
    pos.turn = 'p1';
    pos.halfmoves = 0;
    pos.fullmoves = 1;

    return pos;
  }

  static override getClass() {
    return this;
  }

  static override getInitialBoardFen(): string {
    return '1lLlLlL1/L6l/l6L/L6l/l6L/L6l/l6L/1LlLlLl1';
  }

  protected constructor() {
    super('scrambledeggs');
  }
}
