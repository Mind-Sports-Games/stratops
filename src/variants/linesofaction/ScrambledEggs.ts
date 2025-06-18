import { GameFamily } from './GameFamily';

export class ScrambledEggs extends GameFamily {
  static override default(): ScrambledEggs {
    return super.defaultBoard(new this()) as ScrambledEggs;
  }

  static override getClass() {
    return this;
  }

  static override getInitialBoardFen(): string {
    return '1lLlLlL1/L6l/l6L/L6l/l6L/L6l/l6L/1LlLlLl1';
  }

  protected constructor() {
    super('scrambledeggs');
  }
}
