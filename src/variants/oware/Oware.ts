import type { BoardDimensions, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Oware extends GameFamily {
  static override height: BoardDimensions['ranks'] = 2;
  static override width: BoardDimensions['files'] = 6;
  static override rules: Rules = 'oware';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('oware');
  }
}
