import type { BoardDimensions } from '../../types';
import { GameFamily } from './GameFamily';

export class Togyzkumalak extends GameFamily {
  static override height: BoardDimensions['ranks'] = 2;
  static override width: BoardDimensions['files'] = 9;

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('togyzkumalak');
  }
}
