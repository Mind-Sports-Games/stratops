import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Antidraughts extends GameFamily {
  static override rules: Rules = 'antidraughts';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('antidraughts');
  }
}
