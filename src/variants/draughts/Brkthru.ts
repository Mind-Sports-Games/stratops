import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Brkthru extends GameFamily {
  static override rules: Rules = 'brkthru';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('brkthru');
  }
}
