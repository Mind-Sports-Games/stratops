import { Result } from '@badrap/result';
import { PositionError } from '../../chess';
import { PLAYERINDEXES, Rules } from '../../types';
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

  // protected override validateVariant(): Result<undefined, PositionError> {
  //   const topRowSquares = Array.from({ length: 8 }, (_, i) => 56 + i);
  //   const bottomRowSquares = Array.from({ length: 8 }, (_, i) => i);
  //   for (const square of topRowSquares) {
  //     const piece = this.board.get(square);
  //     if (piece?.playerIndex === PLAYERINDEXES[0]) {
  //       return Result.err(
  //         new PositionError(
  //           `Player 1 has a piece on the top row at square ${square}`,
  //         ),
  //       );
  //     }
  //   }

  //   for (const square of bottomRowSquares) {
  //     const piece = this.board.get(square);
  //     if (piece?.playerIndex === PLAYERINDEXES[1]) {
  //       return Result.err(
  //         new PositionError(
  //           `Player 2 has a piece on the bottom row at square ${square}`,
  //         ),
  //       );
  //     }
  //   }

  //   return Result.ok(undefined);
  // }

  protected constructor() {
    super('breakthrough');
  }
}
