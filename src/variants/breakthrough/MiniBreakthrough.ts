import { Result } from '@badrap/result';
import { BoardDimensions, PLAYERINDEXES, Rules } from '../../types';
import { GameFamily } from './GameFamily';
import { PositionError } from '../../chess';

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

  protected override validateVariant(): Result<undefined, PositionError> {
    const topRowSquares = Array.from({ length: 5 }, (_, i) => 20 + i);
    const bottomRowSquares = Array.from({ length: 5 }, (_, i) => i);
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
    super('minibreakthrough');
  }
}
