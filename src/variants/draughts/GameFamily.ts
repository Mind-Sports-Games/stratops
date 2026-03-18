import type { BoardDimensions } from '../../types';
import { GameFamilyKey, VariantKey } from '../types';
import { Variant } from '../Variant';

// Note: nothing is implemented for Draughts yet.
export abstract class GameFamily extends Variant {
  static override height: BoardDimensions['ranks'] = 10;
  static override width: BoardDimensions['files'] = 10;
  static override family: GameFamilyKey = GameFamilyKey.draughts;

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.antidraughts,
      VariantKey.breakthrough,
      VariantKey.brazilian,
      VariantKey.english,
      VariantKey.frisian,
      VariantKey.fromPositionDraughts,
      VariantKey.frysk,
      VariantKey.international,
      VariantKey.pool,
      VariantKey.portuguese,
      VariantKey.russian,
    ];
  }
}
