import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Hyper extends GameFamily {
  static override rules: Rules = 'hyper';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('hyper');
  }
}
