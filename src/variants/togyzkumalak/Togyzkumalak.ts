import type { BoardDimensions, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Togyzkumalak extends GameFamily {
  static override height: BoardDimensions['ranks'] = 2;
  static override width: BoardDimensions['files'] = 9;
  static override rules: Rules = 'togyzkumalak';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('togyzkumalak');
  }
}
