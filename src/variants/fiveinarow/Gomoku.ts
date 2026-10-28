import { parseFen } from '../../fen';
import type { Role, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Gomoku extends GameFamily {
  static override rules: Rules = 'gomoku';

  static override default(): Gomoku {
    return this.fromSetup(parseFen(this.rules)(this.getInitialFen('p1')).unwrap()).unwrap() as Gomoku;
  }

  static override getClass() {
    return this;
  }

  // an overline is a legal drop for either colour but never wins
  static override winningLine(_role: Role, length: number): boolean {
    return length === 5;
  }

  protected constructor() {
    super('gomoku');
  }
}
