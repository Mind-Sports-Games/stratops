import { Result } from '@badrap/result';
import { kingAttacks } from '../../attacks';
import { type Context, PositionError } from '../../chess';
import type { Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import type { Outcome, PlayerFENChar, PlayerIndex } from '../../types';
import { ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.loa;
  static override playerColors: Record<PlayerIndex, string> = {
    p1: 'black',
    p2: 'white',
  };
  static override playerFENChars: Record<PlayerIndex, PlayerFENChar> = {
    p1: 'w',
    p2: 'b',
  };
  static override playerCharsIndexes: Record<PlayerFENChar, PlayerIndex> = {
    w: 'p1',
    b: 'p2',
  };

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    return move.uci;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getInitialEpd(): string {
    return 'w - -';
  }

  static override getEmptyEpd(): string {
    return `w - -`;
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
    } else if (p1Wins && p2Wins) {
      return { winner: undefined }; // Draw, both players connected
    }
    return undefined;
  }
}
