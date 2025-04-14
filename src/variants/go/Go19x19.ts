import type { BoardDimensions } from '../../types';
import { GameFamily } from './GameFamily';

export class Go19x19 extends GameFamily {
  static override height: BoardDimensions['ranks'] = 19;
  static override width: BoardDimensions['files'] = 19;

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('go19x19');
  }
}
