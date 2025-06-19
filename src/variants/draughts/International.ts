import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class International extends GameFamily {
  static override rules: Rules = 'international';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('international');
  }
}
