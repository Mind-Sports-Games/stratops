import type { Role, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Gomoku extends GameFamily {
  static override rules: Rules = 'gomoku';

  // an overline is a legal drop for either colour but never wins
  static override winningLine(_role: Role, length: number): boolean {
    return length === 5;
  }

  protected constructor() {
    super('gomoku');
  }
}
