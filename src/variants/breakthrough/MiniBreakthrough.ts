import { Result } from '@badrap/result';
import { Chess, IllegalSetup, PositionError } from '../../chess';
import { Setup } from '../../setup';
import { PlayerIndex } from '../../types';

export class MiniBreakthrough extends Chess {
  protected constructor() {
    super('minibreakthrough');
  }

  static default(): MiniBreakthrough {
    return super.default() as MiniBreakthrough;
  }

  static fromSetup(setup: Setup): Result<MiniBreakthrough, PositionError> {
    return super.fromSetup(setup) as Result<MiniBreakthrough, PositionError>;
  }

  clone(): MiniBreakthrough {
    return super.clone() as MiniBreakthrough;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    return Result.ok(undefined);
  }
}
