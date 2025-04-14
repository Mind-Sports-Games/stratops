import { GameFamily } from './GameFamily';

export class Othello extends GameFamily {
  static override default(): Othello {
    return super.defaultBoard(new this()) as Othello;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('flipello');
  }
}
