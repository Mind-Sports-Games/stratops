import { Board } from '../../board';
import { Material } from '../../setup';
import type { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Entropy extends GameFamily {
  static override rules: Rules = 'entropy';

  static override default(): Entropy {
    const pos = new this();
    pos.board = Board.empty('entropy');
    pos.pockets = Material.empty();
    pos.turn = 'p1';
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('entropy');
  }
}
