import { parseFen } from '../../fen';
import type { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Gomoku extends GameFamily {
  static override rules: Rules = 'gomoku';

  static override default(): Gomoku {
    return this.fromSetup(parseFen(this.rules)(this.getInitialFen('p1')).unwrap()).unwrap() as Gomoku;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('gomoku');
  }
}
