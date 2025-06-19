import type { BoardDimensions, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Pool extends GameFamily {
  static override height: BoardDimensions['ranks'] = 8;
  static override width: BoardDimensions['files'] = 8;
  static override rules: Rules = 'pool';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('pool');
  }
}
