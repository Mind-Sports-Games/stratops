import { GameFamily } from './GameFamily';

export class Breakthrough extends GameFamily {
  static override default(): Breakthrough {
    return super.defaultBoard(new this()) as Breakthrough;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('breakthrough');
  }
}
