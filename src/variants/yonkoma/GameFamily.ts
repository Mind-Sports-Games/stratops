import type { Context } from '../../chess';
import type { BoardDimensions, Outcome } from '../../types';
import { type ExtendedMoveInfo, GameFamilyKey, type LexicalUci, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

// Yonkoma (Mark Steere, 2026): two checkers a side that slide like bishops. The move rules
// live in strategygames; this class only knows the board sizes and how to write a move.
export abstract class GameFamily extends Variant {
  static override height: BoardDimensions['ranks'] = 10;
  static override width: BoardDimensions['files'] = 10;
  static override family: GameFamilyKey = GameFamilyKey.yonkoma;

  static override getVariantKeys(): VariantKey[] {
    return [VariantKey.yonkoma10x10, VariantKey.yonkoma12x12];
  }

  // a move is written as its uci, "a1e5"; a skipped turn as "pass"
  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    return move.uci === 'pass' ? 'PASS' : move.uci;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.uci;
  }

  static override parseLexicalUci(uci: string): LexicalUci | undefined {
    if (!uci || uci === 'pass') return undefined;
    return super.parseLexicalUci(uci);
  }

  override outcome(ctx?: Context): Outcome | undefined {
    return this.variantOutcome(ctx);
  }
}
