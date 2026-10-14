import { parseFen } from '../../fen';
import type { Role, Rules } from '../../types';
import { type FiveInARowOpening, GameFamily } from './GameFamily';

export class Renju extends GameFamily {
  static override rules: Rules = 'renju';
  static override opening: FiveInARowOpening = 'taraguchi10';
  static override forbiddenMoves = true;

  static override default(): Renju {
    return this.fromSetup(parseFen(this.rules)(this.getInitialFen('p1')).unwrap()).unwrap() as Renju;
  }

  static override getClass() {
    return this;
  }

  // black wins only with exactly five; an overline is one of black's forbidden moves
  static override winningLine(role: Role, length: number): boolean {
    return role === 'b-piece' ? length === 5 : length >= 5;
  }

  protected constructor() {
    super('renju');
  }
}
