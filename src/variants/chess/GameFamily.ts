import { GameFamilyKey, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override getFamily(): GameFamilyKey | undefined {
    return GameFamilyKey.chess;
  }

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.standard,
      VariantKey.chess960,
      VariantKey.antichess,
      VariantKey.fromPosition,
      VariantKey.kingOfTheHill,
      VariantKey.threeCheck,
      VariantKey.fiveCheck,
      VariantKey.atomic,
      VariantKey.horde,
      VariantKey.racingKings,
      VariantKey.crazyhouse,
      VariantKey.noCastling,
      VariantKey.monster,
    ];
  }
}
