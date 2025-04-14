import { GameFamily } from './GameFamily';

export class LinesOfAction extends GameFamily {
  static override default(): LinesOfAction {
    return super.defaultBoard(new this()) as LinesOfAction;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('linesofaction');
  }
}
