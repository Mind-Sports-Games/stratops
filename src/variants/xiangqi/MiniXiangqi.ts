import type { BoardDimensions } from '../../types';
import { GameFamily } from './GameFamily';

export class MiniXiangqi extends GameFamily {
  static override height: BoardDimensions['ranks'] = 7;
  static override width: BoardDimensions['files'] = 7;

  static override default(): MiniXiangqi {
    return super.defaultBoard(new this()) as MiniXiangqi;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('minixiangqi');
  }
}
