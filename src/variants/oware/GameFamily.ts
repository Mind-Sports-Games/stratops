import { Result } from '@badrap/result';
import type { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { PlayerIndex } from '../../types';
import { ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.oware;

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    const reg = move.uci.match(/[a-z][1-2]/g) as string[];
    const orig = reg[0];
    const origLetter = orig[1] === '1'
      ? orig[0].toUpperCase()
      : this.nextAsciiLetter(orig[0], (96 - orig.charCodeAt(0)) * 2 + this.width + 1);
    // captured number of stones
    const scoreDiff = this.getScoreFromFen(move.fen, 'p1')
      + this.getScoreFromFen(move.fen, 'p2')
      - this.getScoreFromFen(move.prevFen, 'p1')
      - this.getScoreFromFen(move.prevFen, 'p2');
    const scoreText = scoreDiff <= 0 ? '' : ` + ${scoreDiff}`;
    return `${origLetter}${scoreText}`;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.man;
  }

  static override getScoreFromFen(fen: string, playerIndex: string): number {
    return +fen.split(' ')[playerIndex === 'p1' ? 1 : 2];
  }

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.oware,
    ];
  }

  static nextAsciiLetter(letter: string, n: number): string {
    return String.fromCharCode(letter.charCodeAt(0) + n);
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
