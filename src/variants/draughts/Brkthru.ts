import { GameFamily } from './GameFamily';

export class Brkthru extends GameFamily {
  static override getClass() {
    return this;
  }

  protected constructor() {
    super('brkthru');
  }
}
