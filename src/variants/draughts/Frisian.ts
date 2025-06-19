import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Frisian extends GameFamily {
  static override rules: Rules = 'frisian';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('frisian');
  }
}
