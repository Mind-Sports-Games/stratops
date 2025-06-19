import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Breakthrough extends GameFamily {
  static override rules: Rules = 'breakthrough';
  
  static override default(): Breakthrough {
    return super.defaultBoard(new this()) as Breakthrough;
  }

  static override getClass() {
    return this;
  }

  static override getInitialBoardFen(): string {
    return 'pppppppp/pppppppp/8/8/8/8/PPPPPPPP/PPPPPPPP';
  }

  protected constructor() {
    super('breakthrough');
  }
}
