import type { BoardDimensions } from '../../types';
import { GameFamily } from './GameFamily';

export class English extends GameFamily {
  static override height: BoardDimensions['ranks'] = 8;
  static override width: BoardDimensions['files'] = 8;

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('english');
  }
}
