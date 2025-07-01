import { Result } from '@badrap/result';
import { Context, PositionError } from '../../chess';
import { RemainingChecks, Setup } from '../../setup';
import { Outcome, PlayerIndex, PLAYERINDEXES, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class ThreeCheck extends GameFamily {
  static override rules: Rules = '3check';

  static override default(): ThreeCheck {
    const pos = super.default();
    pos.remainingChecks = RemainingChecks.default();
    return pos as ThreeCheck;
  }

  static override fromSetup(setup: Setup): Result<ThreeCheck, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.remainingChecks = setup.remainingChecks ? setup.remainingChecks.clone() : RemainingChecks.default();
      return pos as ThreeCheck;
    });
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('3check');
  }

  override clone(): ThreeCheck {
    return super.clone() as ThreeCheck;
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
