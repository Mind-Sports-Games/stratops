import type { BoardDimensions, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class MiniXiangqi extends GameFamily {
  static override height: BoardDimensions['ranks'] = 7;
  static override width: BoardDimensions['files'] = 7;
  static override rules: Rules = 'minixiangqi';

  static override default(): MiniXiangqi {
    return super.defaultBoard(new this()) as MiniXiangqi;
  }

  static override getClass() {
    return this;
  }

  static override getEmptyBoardFen(): string {
    return '7/7/7/7/7/7/7';
  }

  static override getInitialBoardFen(): string {
    return 'rcnkncr/p1ppp1p/7/7/7/P1PPP1P/RCNKNCR';
  }

  protected constructor() {
    super('minixiangqi');
  }
}
