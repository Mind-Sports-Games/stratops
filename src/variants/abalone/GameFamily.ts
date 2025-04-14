import { Result } from '@badrap/result';
import type { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { PlayerIndex } from '../../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getScoreFromFen(fen: string, playerIndex: string): number | undefined {
    return +fen.split(' ')[playerIndex === 'p1' ? 1 : 2];
  }

  protected override validate(): Result<undefined, PositionError> {
    return Result.ok(undefined);
  }

  override clone(): GameFamily {
    return super.clone() as GameFamily;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false; // having only 1 piece alive for each player could be considered as insufficient material
  }
}
