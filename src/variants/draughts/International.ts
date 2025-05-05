import { GameFamily } from './GameFamily';

export class International extends GameFamily {
  static override getClass() {
    return this;
  }

  protected constructor() {
    super('international');
  }
}
