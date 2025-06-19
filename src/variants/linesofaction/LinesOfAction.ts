import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class LinesOfAction extends GameFamily {
  static override rules: Rules = 'linesofaction';

  static override default(): LinesOfAction {
    return super.defaultBoard(new this()) as LinesOfAction;
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
