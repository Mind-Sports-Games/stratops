import type { BoardDimensions } from '../../types';
import { GameFamilyKey, VariantKey } from '../types';
import { Variant } from '../Variant';

// @Note: nothing is implemented for Dameo yet.
export abstract class GameFamily extends Variant {
  static override height: BoardDimensions['ranks'] = 8;
  static override width: BoardDimensions['files'] = 8;

  static override getFamily(): GameFamilyKey | undefined {
    return GameFamilyKey.dameo;
  }

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.dameo,
    ];
  }
}
