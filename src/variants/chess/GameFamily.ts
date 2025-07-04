import { Result } from '@badrap/result';
import { IllegalSetup, PositionError } from '../../chess';
import { SquareSet } from '../../squareSet';
import { defined, opposite } from '../../util';
import { GameFamilyKey, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.chess;

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.standard,
      VariantKey.chess960,
      VariantKey.antichess,
      VariantKey.fromPosition,
      VariantKey.kingOfTheHill,
      VariantKey.threeCheck,
      VariantKey.fiveCheck,
      VariantKey.atomic,
      VariantKey.horde,
      VariantKey.racingKings,
      VariantKey.crazyhouse,
      VariantKey.noCastling,
      VariantKey.monster,
    ];
  }

  protected override validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (this.board['k-piece'].size() !== 2) return Result.err(new PositionError(IllegalSetup.Kings));

    if (!defined(this.board.kingOf(this.turn))) return Result.err(new PositionError(IllegalSetup.Kings));

    const otherKing = this.board.kingOf(opposite(this.turn));
    if (!defined(otherKing)) return Result.err(new PositionError(IllegalSetup.Kings));
    if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    }

    if (SquareSet.backranks64().intersects(this.board['p-piece'])) {
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    }

    return this.validateCheckers();
  }
}
