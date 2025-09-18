import { Context } from '../../chess';
import { BoardDimensions, Outcome, PLAYERINDEXES, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class MiniBreakthrough extends GameFamily {
  static override height: BoardDimensions['ranks'] = 5;
  static override width: BoardDimensions['files'] = 5;
  static override rules: Rules = 'minibreakthrough';

  static override default(): MiniBreakthrough {
    return super.defaultBoard(new this()) as MiniBreakthrough;
  }

  static override getClass() {
    return this;
  }

  static override getEmptyBoardFen(): string {
    return '5/5/5/5/5';
  }
  static override getInitialBoardFen(): string {
    return 'ppppp/ppppp/5/PPPPP/PPPPP';
  }

  override isVariantEnd(): boolean {
    const topRowSquares = Array.from({ length: 5 }, (_, i) => 20 + i);
    const bottomRowSquares = Array.from({ length: 5 }, (_, i) => i);
    for (const square of topRowSquares) {
      const piece = this.board.get(square);
      if (piece?.playerIndex === PLAYERINDEXES[0]) {
        return true;
      }
    }

    for (const square of bottomRowSquares) {
      const piece = this.board.get(square);
      if (piece?.playerIndex === PLAYERINDEXES[1]) {
        return true;
      }
    }

    return false;
  }

  override variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;
    const goalP1 = Array.from({ length: 5 }, (_, i) => 20 + i);
    const goalP2 = Array.from({ length: 5 }, (_, i) => i);
    const p2InGoal = goalP2.some(square => this.board.get(square)?.playerIndex === PLAYERINDEXES[1]);
    const p1InGoal = goalP1.some(square => this.board.get(square)?.playerIndex === PLAYERINDEXES[0]);
    if (p2InGoal && !p1InGoal) return { winner: 'p2' };
    if (p1InGoal && !p2InGoal) return { winner: 'p1' };
    return { winner: undefined }; // Note : this should not happen
  }

  protected constructor() {
    super('minibreakthrough');
  }
}
