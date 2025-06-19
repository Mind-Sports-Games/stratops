import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Backgammon extends GameFamily {
  static override rules: Rules = 'backgammon';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('backgammon');
  }
}
