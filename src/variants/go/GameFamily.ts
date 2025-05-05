import { Result } from '@badrap/result';
import type { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { PlayerIndex } from '../../types';
import { type ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    if (!move.uci.includes('@')) {
      if (move.uci == 'pass') return 'PASS';
      else if (move.uci == 'ss:') return 'O DS';
      else return `${move.uci.substring(3).split(',').length} DS`;
    }

    const reg = move.uci.match(/([sS]@|[a-zA-Z][1-9][0-9]?)/g) as string[];
    const dest = reg[1];

    return `${dest}`;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getFamily(): GameFamilyKey | undefined {
    return GameFamilyKey.go;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.dpg;
  }

  static override getScoreFromFen(fen: string, playerIndex: string): number | undefined {
    return +fen.split(' ')[playerIndex === 'p1' ? 3 : 4] / 10.0;
  }

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.go9x9,
      VariantKey.go13x13,
      VariantKey.go19x19,
    ];
  }

  protected override validate(): Result<undefined, PositionError> {
    return Result.ok(undefined);
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
