import type { BoardDimensions } from '../../types';
import { GameFamily } from './GameFamily';

export class Bestemshe extends GameFamily {
  static override height: BoardDimensions['ranks'] = 2;
  static override width: BoardDimensions['files'] = 5;

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('bestemshe');
  }
}
