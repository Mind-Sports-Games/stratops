import { Result } from '@badrap/result';
import { Chess, Context, IllegalSetup, PositionError } from '../../chess';
import { Setup } from '../../setup';
import { Outcome, PLAYERINDEXES, PlayerIndex } from '../../types';
import { SquareSet } from '../../squareSet';
import { opposite } from '../../util';

export class Breakthrough extends Chess {
  protected constructor() {
    super('breakthrough');
  }

  static default(): Breakthrough {
    return super.default() as Breakthrough;
  }

  static fromSetup(setup: Setup): Result<Breakthrough, PositionError> {
    return super.fromSetup(setup) as Result<Breakthrough, PositionError>;
  }

  clone(): Breakthrough {
    return super.clone() as Breakthrough;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    return Result.ok(undefined);
  }

  /*
   * seems like outcome and the other related f() below are related to src/san makeSanAndPlay()
   * makeSanAndPlay() is actually not called from within strategygames
   */
  outcome(ctx?: Context): Outcome | undefined {
    const variantOutcome = this.variantOutcome(ctx);
    if (variantOutcome) return variantOutcome;
    ctx = ctx || this.ctx();
    if (this.isInsufficientMaterial()) return { winner: opposite(this.turn) };
    else return;
  }

  isInsufficientMaterial(): boolean {
    return this.hasInsufficientMaterial(this.turn);
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    if (this.board[_playerIndex].intersect(this.board['p-piece']).isEmpty()) return true;
    return false;
  }

  isVariantEnd(): boolean {
    const goalP1 = SquareSet.fromRank64(7);
    const goalP2 = SquareSet.fromRank64(0);
    const p2InGoal = this.board.pieces('p2', 'p-piece').intersects(goalP2);
    const p1InGoal = this.board.pieces('p1', 'p-piece').intersects(goalP1);
    if (p2InGoal || p1InGoal) {
      return true;
    }
    return false;
  }

  variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;
    const goalP1 = SquareSet.fromRank64(7);
    const goalP2 = SquareSet.fromRank64(0);
    const p2InGoal = this.board.pieces('p2', 'p-piece').intersects(goalP2);
    const p1InGoal = this.board.pieces('p1', 'p-piece').intersects(goalP1);
    if (p2InGoal && !p1InGoal) return { winner: 'p2' };
    if (p1InGoal && !p2InGoal) return { winner: 'p1' };
    return { winner: undefined };
  }
}
