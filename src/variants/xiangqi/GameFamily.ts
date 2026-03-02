import { Result } from '@badrap/result';
import { between, ray, rookAttacksWH } from '../../attacks';
import { Context, PositionError } from '../../chess';
import type { Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import type { PlayerIndex, Square } from '../../types';
import { defined, opposite } from '../../util';
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

  /*
    TODO: implement dests for all pieces, currently only rook and king are implemented.
    This method is currently only partially implemented to prevent fairy to fail
     when trying to compute moves for xiangqi variants using methods specific to a 64 squares board.
  */
  override dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();
    if (ctx.variantEnd) return SquareSet.empty();
    const piece = this.board.get(square);
    if (!piece || piece.playerIndex !== this.turn) return SquareSet.empty();
    let pseudo;

    if (piece.role === 'r-piece') {
      pseudo = rookAttacksWH(square, this.board.occupied, GameFamily.width, GameFamily.height);
    }
    if (piece.role === 'k-piece') {
      pseudo = GameFamily.kingAttacks(square);
    }

    if (!pseudo) {
      // TODO: uncomment the line below after all pieces are implemented
      // console.warn('Unknown piece role:', piece.role, 'at square', square, 'for variant', this.constructor.name);
      return SquareSet.empty();
    }

    pseudo = pseudo.diffWH(this.board[this.turn], GameFamily.width, GameFamily.height);

    // Note: check conditions: untested (more or less copy-pasted from the overriden generic one)
    if (defined(ctx.king)) {
      if (piece.role === 'k-piece') {
        const occ = this.board.occupied.without(square);
        for (const to of pseudo) {
          if (this.kingAttackers(to, opposite(this.turn), occ).nonEmpty()) pseudo = pseudo.without(to);
        }
      }

      if (ctx.checkers.nonEmpty()) {
        const checker = ctx.checkers.singleSquare();
        if (!defined(checker)) return SquareSet.empty();
        pseudo = pseudo.intersect(between(checker, ctx.king).with(checker));
      }

      if (ctx.blockers.has(square)) pseudo = pseudo.intersect(ray(square, ctx.king));
    }

    return pseudo;
  }

  protected override validateVariant(): Result<undefined, PositionError> {
    const kings = this.board['k-piece'];
    if (kings.size() !== 2) {
      return Result.err(new PositionError(`There must be exactly 2 kings, found ${kings.size()}.`));
    }
    const kingSquares = Array.from(kings);
    const width = (this.constructor as typeof GameFamily).width;
    const height = (this.constructor as typeof GameFamily).height;
    const king1File = kingSquares[0] % width;
    const king1Rank = Math.floor(kingSquares[0] / width);
    const king2File = kingSquares[1] % width;
    const king2Rank = Math.floor(kingSquares[1] / width);
    if (king1File < 3 || king1File > 5 || king1Rank < 0 || king1Rank > 2) {
      return Result.err(
        new PositionError(
          `King 1 must be in the palace (files 4-6, ranks 1-3), found at file ${king1File + 1}, rank ${king1Rank + 1}.`,
        ),
      );
    }
    if (king2File < 3 || king2File > 5 || king2Rank < height - 3 || king2Rank >= height) {
      return Result.err(
        new PositionError(
          `King 2 must be in the palace (files 4-6, ranks 8-10), found at file ${king2File + 1}, rank ${
            king2Rank + 1
          }.`,
        ),
      );
    }

    return Result.ok(undefined);
  }

  // note : everything related to attacks could be moved to a separate class "Attacks.ts" inside xiangqi namespace.
  static kingAttacks(square: Square): SquareSet {
    const rank = Math.floor(square / this.width);
    const file = square % this.width;
    const deltas = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    let result = SquareSet.empty();
    let palaceRankMin, palaceRankMax;
    if (rank <= 2) {
      palaceRankMin = 0;
      palaceRankMax = 2;
    } else if (rank >= this.height - 3) {
      palaceRankMin = this.height - 3;
      palaceRankMax = this.height - 1;
    } else {
      return SquareSet.empty();
    }
    for (const [df, dr] of deltas) {
      const newFile = file + df;
      const newRank = rank + dr;
      if (
        newFile >= 3 && newFile <= 5
        && newRank >= palaceRankMin && newRank <= palaceRankMax
      ) {
        result = result.with(newRank * this.width + newFile);
      }
    }
    return result;
  }
}
