import { Result } from '@badrap/result';
import { IllegalSetup, PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { PlayerIndex } from '../../types';
import { ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.amazons;

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    return move.uci[0] === 'P' ? move.uci.slice(1) : move.uci;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.uci;
  }

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.backgammon,
      VariantKey.hyper,
      VariantKey.nackgammon,
    ];
  }

  override clone(): GameFamily {
    return super.clone() as GameFamily;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
