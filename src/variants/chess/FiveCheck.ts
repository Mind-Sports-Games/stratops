import { Result } from '@badrap/result';
import { Context, PositionError } from '../../chess';
import { RemainingChecks, Setup } from '../../setup';
import { Outcome, PlayerIndex, PLAYERINDEXES } from '../../types';
import { Variant } from '../Variant';

export class FiveCheck extends Variant {
  static override default(): FiveCheck {
    const pos = super.default();
    pos.remainingChecks = RemainingChecks.fiveCheck();
    return pos;
  }

  static override fromSetup(setup: Setup): Result<FiveCheck, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.remainingChecks = setup.remainingChecks ? setup.remainingChecks.clone() : RemainingChecks.fiveCheck();
      return pos;
    });
  }

  static override getClass() {
    return this;
  }

  static override getScoreFromFen(fen: string, playerIndex: string): number | undefined {
    return +fen.split(' ')[6][playerIndex === 'p1' ? 1 : 3];
  }

  protected constructor() {
    super('5check');
  }

  override remainingChecks: RemainingChecks | undefined;

  override clone(): FiveCheck {
    return super.clone() as FiveCheck;
  }

  override hasInsufficientMaterial(playerIndex: PlayerIndex): boolean {
    return this.board.pieces(playerIndex, 'k-piece').equals(this.board[playerIndex]);
  }

  override isVariantEnd(): boolean {
    return !!this.remainingChecks && (this.remainingChecks.p1 <= 0 || this.remainingChecks.p2 <= 0);
  }

  override variantOutcome(_ctx?: Context): Outcome | undefined {
    if (this.remainingChecks) {
      for (const playerIndex of PLAYERINDEXES) {
        if (this.remainingChecks[playerIndex] <= 0) return { winner: playerIndex };
      }
    }
    return;
  }
}
