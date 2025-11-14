import { Context } from '../../chess';
import { SquareSet } from '../../squareSet';
import { Outcome, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Breakthrough extends GameFamily {
  static override rules: Rules = 'breakthrough';

  static override default(): Breakthrough {
    return super.defaultBoard(new this()) as Breakthrough;
  }

  static override getClass() {
    return this;
  }

  static override getInitialBoardFen(): string {
    return 'pppppppp/pppppppp/8/8/8/8/PPPPPPPP/PPPPPPPP';
  }

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
    return { winner: undefined }; // Note : this should not happen
  }

  protected constructor() {
    super('breakthrough');
  }
}
