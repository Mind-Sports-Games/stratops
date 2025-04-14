import type { BoardDimensions } from '../../types';
import { GameFamily } from './GameFamily';

export class Go9x9 extends GameFamily {
  static override height: BoardDimensions['ranks'] = 9;
  static override width: BoardDimensions['files'] = 9;

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('go9x9');
  }
}
