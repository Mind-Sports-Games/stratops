import { Board } from '../../board';
import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class LinesOfAction extends GameFamily {
  static override rules: Rules = 'linesofaction';

  static override default(): LinesOfAction {
    const pos = new this();
    pos.board = Board.linesOfAction();
    pos.turn = 'p1';
    pos.halfmoves = 0;
    pos.fullmoves = 1;

    return pos;
  }

  static override getClass() {
    return this;
  }

  static override getInitialBoardFen(): string {
    return '1LLLLLL1/l6l/l6l/l6l/l6l/l6l/l6l/1LLLLLL1';
  }

  protected constructor() {
    super('linesofaction');
  }
}
