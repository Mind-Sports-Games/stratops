import { GameFamily } from './GameFamily';

export class ScrambledEggs extends GameFamily {
  static override default(): ScrambledEggs {
    return super.defaultBoard(new this()) as ScrambledEggs;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('scrambledeggs');
  }
}
