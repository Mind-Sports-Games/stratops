import { Result } from '@badrap/result';
import type { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { PlayerIndex } from '../../types';
import { type ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.xiangqi;
  static override playerColors: Record<PlayerIndex, string> = {
    p1: 'red',
    p2: 'black',
  };

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    const parsed = this.parseUciToUsi(move.uci, this.width, this.height),
      board = this.readFen(move.fen, this.height, this.width),
      role = board.pieces[parsed.dest],
      piece = this.roleToPiece(role),
      // converting to xiangqi from shogi board notation -> ranks: p2=1, p1=10 ; rows: left-right p1 pov, 9-1 for p1, 1-9 p2
      prevFile = board.wMoved ? parseInt(parsed.orig[0]) : this.width + 1 - parseInt(parsed.orig[0]),
      prevRank = parseInt(parsed.orig.slice(1)),
      newFile = board.wMoved ? parseInt(parsed.dest[0]) : this.width + 1 - parseInt(parsed.dest[0]),
      newRank = parseInt(parsed.dest.slice(1)),
      isdiagonalMove = newRank !== prevRank && prevFile !== newFile,
      direction = newRank === prevRank
        ? '='
        : (board.wMoved && newRank < prevRank) || (!board.wMoved && newRank > prevRank)
        ? '+'
        : '-',
      movement = direction == '=' || isdiagonalMove ? newFile : Math.abs(newRank - prevRank);

    // Ammend notation due to multiple pawns in row, case 1: pair sideways, case 2: 3 or more up and down and sideways
    if (role === 'p' || role == 'P') {
      const pawnRole = board.wMoved ? 'P' : 'p';
      const addMovedPiece = prevFile !== newFile;
      const pawnRanks = this.numFriendlyPawnsInColumn(
        parsed.orig[0],
        board,
        this.height,
        pawnRole,
        addMovedPiece,
        prevRank,
        newRank,
      );

      if (pawnRanks.length == 2) {
        const pawnOp =
          (pawnRanks.indexOf(prevRank) == 0 && board.wMoved) || (pawnRanks.indexOf(prevRank) == 1 && !board.wMoved)
            ? '+'
            : '-';
        return `${piece}${pawnOp}${direction}${movement}`;
      } else if (pawnRanks.length > 2) {
        const pawnNum = board.wMoved ? pawnRanks.indexOf(prevRank) + 1 : pawnRanks.length - pawnRanks.indexOf(prevRank);
        return `${pawnNum}${prevFile}${direction}${movement}`;
      } else {
        return `${piece}${prevFile}${direction}${movement}`;
      }
    } else {
      return `${piece}${prevFile}${direction}${movement}`;
    }
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.wxf;
  }

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.minixiangqi,
      VariantKey.xiangqi,
    ];
  }

  static roleToPiece(role: string) {
    switch (role) {
      case 'n':
      case 'N':
        return 'H';
      case 'b':
      case 'B':
        return 'E';
      default:
        return role.toUpperCase();
    }
  }

  static numFriendlyPawnsInColumn(
    origFile: string,
    board: any,
    numRanks: number,
    role: string,
    addMovedPiece: boolean,
    origPieceRank: number,
    newPieceRank: number,
  ): number[] {
    const pawnRanks: number[] = [];
    const ranks = [...Array(numRanks + 1).keys()].slice(1);
    ranks.forEach(r => {
      if (addMovedPiece && r === origPieceRank) pawnRanks.push(origPieceRank); // add the moved piece in this position to avoid sorting
      const piece = board.pieces[origFile + r.toString()];
      if (piece === role) {
        if (!addMovedPiece && r === newPieceRank) {
          pawnRanks.push(origPieceRank); // add moved pawn in original position in order to acquire its index from prev position
        } else {
          pawnRanks.push(r);
        }
      }
    });
    return pawnRanks;
  }

  override clone(): GameFamily {
    return super.clone() as GameFamily;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
