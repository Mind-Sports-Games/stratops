import { GameFamily } from './GameFamily';

export class Hyper extends GameFamily {
  static override getClass() {
    return this;
  }

  protected constructor() {
    super('hyper');
  }
}
