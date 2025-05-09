import { Result } from '@badrap/result';
import { Board } from '../../board';
import { Castles, IllegalSetup, PositionError } from '../../chess';
import { Setup } from '../../setup';
import { GameFamily } from './GameFamily';

export class Monster extends GameFamily {
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

  protected constructor() {
    super('monster');
  }

  protected override validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    // TODO: maybe do some more validation of the position
    return Result.ok(undefined);
  }

  override clone(): Monster {
    return super.clone() as Monster;
  }
}
