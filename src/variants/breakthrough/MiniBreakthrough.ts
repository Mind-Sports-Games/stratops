import { BoardDimensions, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class MiniBreakthrough extends GameFamily {
  static override height: BoardDimensions['ranks'] = 5;
  static override width: BoardDimensions['files'] = 5;
  static override rules: Rules = 'minibreakthrough';

  static override default(): MiniBreakthrough {
    return super.defaultBoard(new this()) as MiniBreakthrough;
  }

  static override getClass() {
    return this;
  }

  static override getEmptyBoardFen(): string {
    return '5/5/5/5/5';
  }
  static override getInitialBoardFen(): string {
    return 'ppppp/ppppp/5/PPPPP/PPPPP';
  }

  protected constructor() {
    super('minibreakthrough');
  }
}
