import { Result } from '@badrap/result';
import { Board } from '../../board';
import { Castles, Context, IllegalSetup, PositionError } from '../../chess';
import { Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import { Outcome, PlayerIndex, PLAYERINDEXES } from '../../types';
import { defined, opposite } from '../../util';
import { GameFamily } from './GameFamily';

export class Horde extends GameFamily {
  static override default(): Horde {
    const pos = new this();
    pos.board = Board.horde();
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

  static override fromSetup(setup: Setup): Result<Horde, PositionError> {
    return super.fromSetup(setup) as Result<Horde, PositionError>;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('horde');
  }

  protected override validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (!this.board['k-piece'].isSingleSquare()) return Result.err(new PositionError(IllegalSetup.Kings));
    if (!this.board['k-piece'].diff64(this.board.promoted).isSingleSquare()) {
      return Result.err(new PositionError(IllegalSetup.Kings));
    }

    const otherKing = this.board.kingOf(opposite(this.turn));
    if (defined(otherKing) && this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    }
    for (const playerIndex of PLAYERINDEXES) {
      if (this.board.pieces(playerIndex, 'p-piece').intersects(SquareSet.backrank64(opposite(playerIndex)))) {
        return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
      }
    }
    return this.validateCheckers();
  }

  override clone(): Horde {
    return super.clone() as Horde;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    // TODO: Could detect cases where the horde cannot mate.
    return false;
  }

  override isVariantEnd(): boolean {
    return this.board.p1.isEmpty() || this.board.p2.isEmpty();
  }

  override variantOutcome(_ctx?: Context): Outcome | undefined {
    if (this.board.p1.isEmpty()) return { winner: 'p2' };
    if (this.board.p2.isEmpty()) return { winner: 'p1' };
    return;
  }
}
