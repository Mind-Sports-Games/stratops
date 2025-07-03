import { type Context } from '../../chess';
import type { Outcome, PlayerIndex } from '../../types';
import { opposite } from '../../util';
import { ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.breakthroughtroyka;

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    return move.uci;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.uci;
  }

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.breakthroughtroyka,
      VariantKey.minibreakthroughtroyka,
    ];
  }

  override outcome(ctx?: Context): Outcome | undefined {
    const variantOutcome = this.variantOutcome(ctx);
    if (variantOutcome) return variantOutcome;
    ctx = ctx || this.ctx();
    if (this.isInsufficientMaterial()) return { winner: opposite(this.turn) };
    else return;
  }

  override isInsufficientMaterial(): boolean {
    return this.hasInsufficientMaterial(this.turn);
  }

  override hasInsufficientMaterial(playerIndex: PlayerIndex): boolean {
    if (this.board[playerIndex].intersect(this.board['p-piece']).isEmpty()) return true;
    return false;
  }
}
