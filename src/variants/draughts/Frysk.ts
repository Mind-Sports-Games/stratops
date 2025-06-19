import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Frysk extends GameFamily {
  static override rules: Rules = 'frysk';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('frysk');
  }
}
