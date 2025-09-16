import type { BoardDimensions } from '../../types';
import { ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
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

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    return move.uci.slice(0,2)+"-"+move.uci.slice(2)
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.dmo;
  }

  static combinedNotation(actionNotations: string[]): string {
    let output = actionNotations[0];
    for (const notation of actionNotations.slice(1)) {
      output += notation.slice(2)
    }
    return output;
  }
}
