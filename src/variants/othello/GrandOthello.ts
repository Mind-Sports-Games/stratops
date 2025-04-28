import type { BoardDimensions } from '../../types';
import { GameFamily } from './GameFamily';

export class GrandOthello extends GameFamily {
  static override height: BoardDimensions['ranks'] = 10;
  static override width: BoardDimensions['files'] = 10;

  static override default(): GrandOthello {
    return super.defaultBoard(new this()) as GrandOthello;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('flipello10');
  }
}
