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

  protected override validateVariant(): Result<undefined, PositionError> {
    const topRowSquares = Array.from({ length: 8 }, (_, i) => 56 + i);
    const bottomRowSquares = Array.from({ length: 8 }, (_, i) => i);
    for (const square of topRowSquares) {
      const piece = this.board.get(square);
      if (piece?.playerIndex === PLAYERINDEXES[0]) {
        return Result.err(
          new PositionError(
            `Player 1 has a piece on the top row at square ${square}`,
          ),
        );
      }
    }

    for (const square of bottomRowSquares) {
      const piece = this.board.get(square);
      if (piece?.playerIndex === PLAYERINDEXES[1]) {
        return Result.err(
          new PositionError(
            `Player 2 has a piece on the bottom row at square ${square}`,
          ),
        );
      }
    }

    return Result.ok(undefined);
  }

  protected constructor() {
    super('breakthrough');
  }
}
