import type { Role, Rules } from '../../types';
import { type FiveInARowOpening, GameFamily } from './GameFamily';

export class Renju extends GameFamily {
  static override rules: Rules = 'renju';
  static override opening: FiveInARowOpening = 'taraguchi10';
  static override forbiddenActions = true;

  // black wins only with exactly five; an overline is one of black's forbidden actions
  static override winningLine(role: Role, length: number): boolean {
    return role === 'b-piece' ? length === 5 : length >= 5;
  }

  protected constructor() {
    super('renju');
  }
}
