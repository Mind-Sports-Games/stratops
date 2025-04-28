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

  protected constructor() {
    super('xiangqi');
  }
}
