import { Result } from '@badrap/result';
import type { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { PlayerIndex } from '../../types';
import { ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.togyzkumalak;

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    const reg = move.uci.match(/[a-z][1-2]/g) as string[];
    const orig = reg[0];
    const dest = reg[1];
    const origNumber = orig[1] === '1' ? orig.charCodeAt(0) - 96 : 97 - orig.charCodeAt(0) + this.width;
    const destNumber = dest[1] === '1' ? dest.charCodeAt(0) - 96 : 97 - dest.charCodeAt(0) + this.width;
    const gainedStones = orig[1] === '1'
      ? this.getScoreFromFen(move.fen, 'p1') > this.getScoreFromFen(move.prevFen, 'p1')
      : this.getScoreFromFen(move.fen, 'p2') > this.getScoreFromFen(move.prevFen, 'p2');
    const destEmpty = this.isDestEmptyInTogyFen(dest, destNumber, move.fen, this.width);
    const isCapture = gainedStones && orig[1] !== dest[1] && destEmpty;

    const score = orig[1] === '1' ? this.getScoreFromFen(move.fen, 'p1') : this.getScoreFromFen(move.fen, 'p2');
    const scoreText = isCapture ? `(${score})` : '';

    const createdTuzdik = orig[1] === '1'
      ? this.hasTuzdik(move.fen, 'p1') && !this.hasTuzdik(move.prevFen, 'p1')
      : this.hasTuzdik(move.fen, 'p2') && !this.hasTuzdik(move.prevFen, 'p2');

    return `${origNumber}${destNumber}${createdTuzdik ? 'X' : ''}${scoreText}`;
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
      VariantKey.bestemshe,
      VariantKey.togyzkumalak,
    ];
  }

  static hasTuzdik(fen: string, playerIndex: string): boolean {
    return ['T', 't'].some(t => fen.split(' ')[0].split('/')[playerIndex === 'p1' ? 0 : 1].includes(t));
  }

  static isDestEmptyInTogyFen(dest: string, destNumber: number, fen: string, width: number): boolean {
    const fenOpponentPart = fen.split(' ')[0].split('/')[dest[1] === '1' ? 1 : 0];
    const destIndex = dest[1] === '1' ? destNumber - 1 : width - destNumber;
    let currentIndex = 0;
    for (const f of fenOpponentPart.split(',')) {
      if (isNaN(+f)) {
        if (currentIndex >= destIndex) return false;
        currentIndex++;
      } else {
        for (let j = 0; j < Number(+f); j++) {
          if (currentIndex === destIndex) return true;
          currentIndex++;
        }
      }
    }
    return false;
  }

  protected override validate(): Result<undefined, PositionError> {
    return Result.ok(undefined);
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
