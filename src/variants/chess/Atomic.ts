import { Result } from '@badrap/result';
import { kingAttacks } from '../../attacks';
import { Context, IllegalSetup, PositionError } from '../../chess';
import { Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import { Outcome, Piece, PlayerIndex, PLAYERINDEXES, Rules, Square } from '../../types';
import { defined, opposite } from '../../util';
import { GameFamily } from './GameFamily';

export class Atomic extends GameFamily {
  static override rules: Rules = 'atomic';

  static override default(): Atomic {
    return super.default() as Atomic;
  }

  static override fromSetup(setup: Setup): Result<Atomic, PositionError> {
    return super.fromSetup(setup) as Result<Atomic, PositionError>;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('atomic');
  }

  protected override kingAttackers(square: Square, attacker: PlayerIndex, occupied: SquareSet): SquareSet {
    if (kingAttacks(square).intersects(this.board.pieces(attacker, 'k-piece'))) {
      return SquareSet.empty();
    }
    return super.kingAttackers(square, attacker, occupied);
  }

  protected override playCaptureAt(square: Square, captured: Piece): void {
    super.playCaptureAt(square, captured);
    this.board.take(square);
    for (const explode of kingAttacks(square).intersect(this.board.occupied).diff64(this.board['p-piece'])) {
      const piece = this.board.take(explode);
      if (piece && piece.role === 'r-piece') this.castles.discardRook(explode);
      if (piece && piece.role === 'k-piece') this.castles.discardSide(piece.playerIndex);
    }
  }

  protected override validate(): Result<undefined, PositionError> {
    // Like chess, but allow our king to be missing and any number of checkers.
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (this.board['k-piece'].size() > 2) return Result.err(new PositionError(IllegalSetup.Kings));
    const otherKing = this.board.kingOf(opposite(this.turn));
    if (!defined(otherKing)) return Result.err(new PositionError(IllegalSetup.Kings));
    if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    }
    if (SquareSet.backranks64().intersects(this.board['p-piece'])) {
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    }
    return Result.ok(undefined);
  }

  override clone(): Atomic {
    return super.clone() as Atomic;
  }

  override dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();
    let dests = SquareSet.empty();
    for (const to of this.pseudoDests(square, ctx)) {
      const after = this.clone();
      after.play({ from: square, to });
      const ourKing = after.board.kingOf(this.turn);
      if (
        defined(ourKing)
        && (!defined(after.board.kingOf(after.turn))
          || after.kingAttackers(ourKing, after.turn, after.board.occupied).isEmpty())
      ) {
        dests = dests.with(to);
      }
    }
    return dests;
  }

  override hasInsufficientMaterial(playerIndex: PlayerIndex): boolean {
    // Remaining material does not matter if the enemy king is already
    // exploded.
    if (this.board.pieces(opposite(playerIndex), 'k-piece').isEmpty()) return false;

    // Bare king cannot mate.
    if (this.board[playerIndex].diff64(this.board['k-piece']).isEmpty()) return true;

    // As long as the enemy king is not alone, there is always a chance their
    // own pieces explode next to it.
    if (this.board[opposite(playerIndex)].diff64(this.board['k-piece']).nonEmpty()) {
      // Unless there are only bishops that cannot explode each other.
      if (this.board.occupied.equals(this.board['b-piece'].union(this.board['k-piece']))) {
        if (!this.board['b-piece'].intersect(this.board.p1).intersects(SquareSet.darkSquares64())) {
          return !this.board['b-piece'].intersect(this.board.p2).intersects(SquareSet.lightSquares64());
        }
        if (!this.board['b-piece'].intersect(this.board.p1).intersects(SquareSet.lightSquares64())) {
          return !this.board['b-piece'].intersect(this.board.p2).intersects(SquareSet.darkSquares64());
        }
      }
      return false;
    }

    // Queen or pawn (future queen) can give mate against bare king.
    if (this.board['q-piece'].nonEmpty() || this.board['p-piece'].nonEmpty()) return false;

    // Single knight, bishop or rook cannot mate against bare king.
    if (this.board['n-piece'].union(this.board['b-piece']).union(this.board['r-piece']).isSingleSquare()) return true;

    // If only knights, more than two are required to mate bare king.
    if (this.board.occupied.equals(this.board['n-piece'].union(this.board['k-piece']))) {
      return this.board['n-piece'].size() <= 2;
    }

    return false;
  }

  override isVariantEnd(): boolean {
    return !!this.variantOutcome();
  }

  override variantOutcome(_ctx?: Context): Outcome | undefined {
    for (const playerIndex of PLAYERINDEXES) {
      if (this.board.pieces(playerIndex, 'k-piece').isEmpty()) return { winner: opposite(playerIndex) };
    }
    return;
  }
}
