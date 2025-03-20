import { Result } from '@badrap/result';
import { Board } from '../../board';
import { Castles, Chess, PositionError } from '../../chess';
import { Setup } from '../../setup';
import { PlayerIndex, Rules } from '../../types';

export abstract class XiangqiFamily extends Chess {
  protected constructor(game: Rules) {
    super(game);
  }

  protected validate(): Result<undefined, PositionError> {
    return Result.ok(undefined); // @TODO: used in Ceval only currently - does not need a real validation
  }

  // these are stubs so the code compiles - we do not use them in lila yet.
  static defaultBoard(pos: XiangqiFamily) {
    pos.board = Board.default();
    pos.pockets = undefined;
    pos.turn = 'p1';
    pos.castles = Castles.empty();
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static validSetup(setup: Setup, pos: XiangqiFamily): Result<XiangqiFamily, PositionError> {
    pos.board = setup.board.clone();
    pos.pockets = undefined;
    pos.turn = setup.turn;
    pos.castles = Castles.empty();
    pos.remainingChecks = undefined;
    pos.halfmoves = setup.halfmoves;
    pos.fullmoves = setup.fullmoves;
    return pos.validate().map(_ => pos);
  }

  clone(): XiangqiFamily {
    return super.clone() as XiangqiFamily;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
