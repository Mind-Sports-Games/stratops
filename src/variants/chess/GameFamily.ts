import { Result } from '@badrap/result';
import { IllegalSetup, PositionError } from '../../chess';
import { SquareSet } from '../../squareSet';
import { defined, opposite } from '../../util';
import { GameFamilyKey, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override allowCastling: boolean = true;
  static override family: GameFamilyKey = GameFamilyKey.chess;

  static override getInitialEpd(): string {
    return `${this.playerFENChars['p1']} KQkq -`;
  }

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

  /*
    Copied from https://github.com/lichess-org/lila/commit/2017682f3871d90ab68db7c3495d4886c9c9fcfe
    License: AGPL-3
    Functions: fixFenForEp, getEnPassantOptions, nthIndexOf
  */
  static fixFenForEp(fen: string): string {
    let enPassant = fen.split(' ')[3];
    if (enPassant !== '-' && !this.getEnPassantOptions(fen).includes(enPassant)) {
      enPassant = '-';
    }

    const epIndex = this.nthIndexOf(fen, ' ', 2) + 1;
    const epEndIndex = fen.indexOf(' ', epIndex);
    return `${fen.substring(0, epIndex)}${enPassant}${fen.substring(epEndIndex)}`;
  }

  static getEnPassantOptions(fen: string): string[] {
    const unpackRank = (packedRank: string) =>
      [...packedRank].reduce((accumulator, current) => {
        const parsedInt = parseInt(current);
        return accumulator + (parsedInt >= 1 ? 'x'.repeat(parsedInt) : current);
      }, '');
    const checkRank = (rank: string, regex: RegExp, offset: number, filesEnPassant: Set<number>) => {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(rank)) != null) {
        filesEnPassant.add(match.index + offset);
      }
    };
    const filesEnPassant: Set<number> = new Set();
    const [positions, turn] = fen.split(' ');
    const ranks = positions.split('/');
    const unpackedRank = unpackRank(ranks[turn === 'w' ? 3 : 4]);
    checkRank(unpackedRank, /pP/g, turn === 'w' ? 0 : 1, filesEnPassant);
    checkRank(unpackedRank, /Pp/g, turn === 'w' ? 1 : 0, filesEnPassant);
    const [rank1, rank2] = filesEnPassant.size >= 1
      ? [unpackRank(ranks[turn === 'w' ? 1 : 6]), unpackRank(ranks[turn === 'w' ? 2 : 5])]
      : [null, null];
    return Array.from(filesEnPassant)
      .filter(e => rank1![e] === 'x' && rank2![e] === 'x')
      .map(e => String.fromCharCode('a'.charCodeAt(0) + e) + (turn === 'w' ? '6' : '3'));
  }

  private static nthIndexOf = (haystack: string, needle: string, n: number): number => {
    let index = haystack.indexOf(needle);
    while (n-- > 0) {
      if (index === -1) break;
      index = haystack.indexOf(needle, index + needle.length);
    }
    return index;
  };
}
