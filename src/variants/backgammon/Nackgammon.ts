import { GameFamily } from './GameFamily';

export class Nackgammon extends GameFamily {
  static override getClass() {
    return this;
  }

  protected constructor() {
    super('nackgammon');
  }
}
