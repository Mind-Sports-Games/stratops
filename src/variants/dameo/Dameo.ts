import { GameFamily } from './GameFamily';

export class Dameo extends GameFamily {
  static override getClass() {
    return this;
  }

  protected constructor() {
    super('dameo');
  }
}
