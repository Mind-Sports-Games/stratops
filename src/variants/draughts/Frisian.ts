import { GameFamily } from './GameFamily';

export class Frisian extends GameFamily {
  static override getClass() {
    return this;
  }

  protected constructor() {
    super('frisian');
  }
}
