import { GameFamily } from './GameFamily';

export class Antidraughts extends GameFamily {
  static override getClass() {
    return this;
  }

  protected constructor() {
    super('antidraughts');
  }
}
