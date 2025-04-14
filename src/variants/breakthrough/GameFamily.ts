import { Result } from '@badrap/result';
import { type Context, IllegalSetup, PositionError } from '../../chess';
import { SquareSet } from '../../squareSet';
import type { Outcome, PlayerIndex } from '../../types';
import { opposite } from '../../util';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  protected override validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    return Result.ok(undefined);
  }

  override outcome(ctx?: Context): Outcome | undefined {
    const variantOutcome = this.variantOutcome(ctx);
    if (variantOutcome) return variantOutcome;
    ctx = ctx || this.ctx();
    if (this.isInsufficientMaterial()) return { winner: opposite(this.turn) };
    else return;
  }

  override isInsufficientMaterial(): boolean {
    return this.hasInsufficientMaterial(this.turn);
  }

  override hasInsufficientMaterial(playerIndex: PlayerIndex): boolean {
    if (this.board[playerIndex].intersect(this.board['p-piece']).isEmpty()) return true;
    return false;
  }

  // @TODO: refactor lines related to goal and pxingoal in isVariantEnd and variantOutcome
  override isVariantEnd(): boolean {
    const goalP1 = SquareSet.fromRank64((this.constructor as typeof GameFamily).height - 1);
    const goalP2 = SquareSet.fromRank64(0);
    const p2InGoal = this.board.pieces('p2', 'p-piece').intersects(goalP2);
    const p1InGoal = this.board.pieces('p1', 'p-piece').intersects(goalP1);
    if (p2InGoal || p1InGoal) {
      return true;
    }
    return false;
  }

  override variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;
    const goalP1 = SquareSet.fromRank64((this.constructor as typeof GameFamily).height - 1);
    const goalP2 = SquareSet.fromRank64(0);
    const p2InGoal = this.board.pieces('p2', 'p-piece').intersects(goalP2);
    const p1InGoal = this.board.pieces('p1', 'p-piece').intersects(goalP1);
    if (p2InGoal && !p1InGoal) return { winner: 'p2' };
    if (p1InGoal && !p2InGoal) return { winner: 'p1' };
    return { winner: undefined };
  }
}
