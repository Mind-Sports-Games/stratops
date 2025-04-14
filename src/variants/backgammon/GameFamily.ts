import type { Result } from '@badrap/result';
import type { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { BoardDimensions, PlayerIndex } from '../../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override height: BoardDimensions['ranks'] = 2;
  static override width: BoardDimensions['files'] = 12;

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getScoreFromFen(fen: string, playerIndex: string): number | undefined {
    return +fen.split(' ')[playerIndex === 'p1' ? 4 : 5];
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
