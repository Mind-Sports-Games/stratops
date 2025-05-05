import { Result } from '@badrap/result';
import { kingAttacks } from '../../attacks';
import { type Context, IllegalSetup, PositionError } from '../../chess';
import type { Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import type { Outcome, PlayerIndex } from '../../types';
import { ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    return move.uci;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getFamily(): GameFamilyKey | undefined {
    return GameFamilyKey.loa;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.uci;
  }

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.linesOfAction,
      VariantKey.scrambledEggs,
    ];
  }

  protected override validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    // TODO: maybe do some more validation of the position
    return Result.ok(undefined);
  }

  override clone(): GameFamily {
    return super.clone() as GameFamily;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }

  override isVariantEnd(): boolean {
    return !!this.variantOutcome();
  }

  isPlayerIndexConnected(playerIndex: PlayerIndex): boolean {
    const pieces = playerIndex === 'p1' ? this.board.p1 : this.board.p2;
    let connected = SquareSet.empty();

    let next = pieces.first();
    while (next) {
      connected = connected.with(next);
      next = kingAttacks(next).intersect(pieces).diff64(connected).first();
    }
    return connected.size() > 0 && connected.size() === pieces.size();
  }

  override variantOutcome(_ctx?: Context): Outcome | undefined {
    const p1Wins = this.isPlayerIndexConnected('p1');
    const p2Wins = this.isPlayerIndexConnected('p2');
    if (p1Wins && !p2Wins) {
      return { winner: 'p1' };
    } else if (!p1Wins && p2Wins) {
      return { winner: 'p2' };
    } else {
      return undefined;
    }
  }
}
