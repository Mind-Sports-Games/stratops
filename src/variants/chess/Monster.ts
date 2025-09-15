import { Result } from '@badrap/result';
import { Board } from '../../board';
import { Castles, IllegalSetup, PositionError } from '../../chess';
import { Setup } from '../../setup';
import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Monster extends GameFamily {
  static override rules: Rules = 'monster';
  static override standardInitialPosition: boolean = false;

  static override default(): Monster {
    const pos = new this();
    pos.board = Board.monster();
    pos.pockets = undefined;
    pos.turn = 'p1';
    pos.castles = Castles.default();
    pos.castles.discardSide('p1');
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static override fromSetup(setup: Setup): Result<Monster, PositionError> {
    return super.fromSetup(setup) as Result<Monster, PositionError>;
  }

  static override getClass() {
    return this;
  }

  static override getInitialBoardFen(): string {
    return 'rnbqkbnr/pppppppp/8/8/8/8/2PPPP2/4K3';
  }

  static override getInitialEpd(): string {
    return `w kq -`;
  }

  protected constructor() {
    super('monster');
  }

  override clone(): Monster {
    return super.clone() as Monster;
  }
}
