import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Nackgammon extends GameFamily {
  static override rules: Rules = 'nackgammon';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('nackgammon');
  }
}
