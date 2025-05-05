import { GameFamily } from './GameFamily';

export class Frysk extends GameFamily {
  static override getClass() {
    return this;
  }

  protected constructor() {
    super('frysk');
  }
}
