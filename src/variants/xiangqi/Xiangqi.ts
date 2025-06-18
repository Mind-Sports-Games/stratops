import type { BoardDimensions } from '../../types';
import { GameFamily } from './GameFamily';

export class Xiangqi extends GameFamily {
  static override height: BoardDimensions['ranks'] = 10;
  static override width: BoardDimensions['files'] = 9;

  static override default(): Xiangqi {
    return super.defaultBoard(new this()) as Xiangqi;
  }

  static override getClass() {
    return this;
  }

  static override getEmptyBoardFen(): string {
    return '9/9/9/9/9/9/9/9/9/9';
  }

  static override getInitialBoardFen(): string {
    return 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR';
  }

  protected constructor() {
    super('xiangqi');
  }
}
