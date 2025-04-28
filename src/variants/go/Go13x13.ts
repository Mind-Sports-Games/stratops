import type { BoardDimensions } from '../../types';
import { GameFamily } from './GameFamily';

export class Go13x13 extends GameFamily {
  static override height: BoardDimensions['ranks'] = 13;
  static override width: BoardDimensions['files'] = 13;

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('go13x13');
  }
}
