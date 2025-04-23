import { Result } from '@badrap/result';
import { IllegalSetup, PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { PlayerIndex } from '../../types';
import { ExtendedMoveInfo, NotationStyle } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    return move.uci[0] === 'P' ? move.uci.slice(1) : move.uci;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.uci;
  }

  protected override validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));

    return Result.ok(undefined);
  }

  override clone(): GameFamily {
    return super.clone() as GameFamily;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
