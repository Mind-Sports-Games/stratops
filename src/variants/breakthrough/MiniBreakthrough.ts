import { BoardDimensions } from '../../types';
import { GameFamily } from './GameFamily';

export class MiniBreakthrough extends GameFamily {
  static override height: BoardDimensions['ranks'] = 5;
  static override width: BoardDimensions['files'] = 5;

  static override default(): MiniBreakthrough {
    return super.defaultBoard(new this()) as MiniBreakthrough;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('minibreakthrough');
  }
}
