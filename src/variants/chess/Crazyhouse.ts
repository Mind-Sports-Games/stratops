import { Result } from '@badrap/result';
import { between } from '../../attacks';
import { Context, IllegalSetup, PositionError } from '../../chess';
import { Material, Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import { PlayerIndex } from '../../types';
import { defined } from '../../util';
import { Variant } from '../Variant';

export class Crazyhouse extends Variant {
  static override default(): Crazyhouse {
    const pos = super.default();
    pos.pockets = Material.empty();
    return pos as Crazyhouse;
  }

  static override fromSetup(setup: Setup): Result<Crazyhouse, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.pockets = setup.pockets ? setup.pockets.clone() : Material.empty();
      return pos as Crazyhouse;
    });
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('crazyhouse');
  }

  protected override validate(): Result<undefined, PositionError> {
    return super.validate().chain(_ => {
      if (this.pockets && (this.pockets.p1['k-piece'] > 0 || this.pockets.p2['k-piece'] > 0)) {
        return Result.err(new PositionError(IllegalSetup.Kings));
      }
      if ((this.pockets ? this.pockets.count() : 0) + this.board.occupied.size() > 64) {
        return Result.err(new PositionError(IllegalSetup.Variant));
      }
      return Result.ok(undefined);
    });
  }

  override clone(): Crazyhouse {
    return super.clone() as Crazyhouse;
  }

  override dropDests(ctx?: Context): SquareSet {
    const mask = this.board.occupied
      .complement()
      .intersect(
        this.pockets?.[this.turn].hasNonPawns()
          ? SquareSet.full64()
          : this.pockets?.[this.turn].hasPawns()
          ? SquareSet.backranks64().complement()
          : SquareSet.empty(),
      );

    ctx = ctx || this.ctx();
    if (defined(ctx.king) && ctx.checkers.nonEmpty()) {
      const checker = ctx.checkers.singleSquare();
      if (!defined(checker)) return SquareSet.empty();
      return mask.intersect(between(checker, ctx.king));
    } else return mask;
  }

  override hasInsufficientMaterial(playerIndex: PlayerIndex): boolean {
    // No material can leave the game, but we can easily check this for
    // custom positions.
    if (!this.pockets) return super.hasInsufficientMaterial(playerIndex);
    return (
      this.board.occupied.size() + this.pockets.count() <= 3
      && this.board['p-piece'].isEmpty()
      && this.board.promoted.isEmpty()
      && this.board.rooksAndQueens().isEmpty()
      && this.pockets.p1['p-piece'] <= 0
      && this.pockets.p2['p-piece'] <= 0
      && this.pockets.p1['r-piece'] <= 0
      && this.pockets.p2['r-piece'] <= 0
      && this.pockets.p1['q-piece'] <= 0
      && this.pockets.p2['q-piece'] <= 0
    );
  }
}
