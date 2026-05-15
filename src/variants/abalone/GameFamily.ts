import { Result } from '@badrap/result';
import { Board } from '../../board';
import { Context, IllegalSetup, PositionError } from '../../chess';
import {
  charToPiece,
  FenError,
  InvalidFen,
  parseFen as parseFenVariant,
  parseFullMoves,
  parseHalfMoves,
  parsePlayerTurn,
  parsePliesRemainingThisTurn,
  parseScore,
} from '../../fen';
import * as fp from '../../fp';
import { defaultSetup, type Setup } from '../../setup';
import type { Outcome } from '../../types';
import type { Piece, PlayerIndex } from '../../types';
import { opposite } from '../../util.js';
import { type ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';
import {
  add,
  areEqual,
  dist,
  div,
  getNeighVectors,
  getNextCore,
  getPrevCore,
  includes,
  key2pos,
  matchKeys,
  MoveNotation,
  mult,
  norm,
  type Pos,
  pos2key,
  sub,
} from './util';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.abalone;
  static override playerColors: Record<PlayerIndex, string> = {
    p1: 'black',
    p2: 'white',
  };
  static startingPieceCount: number | undefined = undefined;
  static winningScore: number | undefined = undefined;
  p1Captures: number = 0;
  p2Captures: number = 0;

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.abalone,
      VariantKey.grandAbalone,
    ];
  }

  //
  //
  override clone(): GameFamily {
    return super.clone() as GameFamily;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return (super.fromSetup(setup) as Result<GameFamily, PositionError>).map(pos => {
      pos.p1Captures = setup.p1Captures ?? 0;
      pos.p2Captures = setup.p2Captures ?? 0;
      return pos;
    });
  }

  override toSetup(): Setup {
    return {
      ...super.toSetup(),
      p1Captures: this.p1Captures,
      p2Captures: this.p2Captures,
    };
  }

  static override getScoreFromFen(fen: string, playerIndex: string): number | undefined {
    return +fen.split(' ')[playerIndex === 'p1' ? 1 : 2];
  }

  static override parseFen(fen: string): Result<Setup, FenError> {
    return parseFenVariant(this.rules)(fen);
  }

  static override getPiecesCoordinates(_fen: string, _playerIndex: PlayerIndex): { piece: string; coord: string }[] {
    return [];
  }

  static override getInitialEpd(playerIndex: PlayerIndex): string {
    return `0 0 ${playerIndex === 'p1' ? 'b' : 'w'}`;
  }

  static override getEmptyEpd(): string {
    return '0 0 b';
  }

  static computeCaptureSetup(board: Board): { p1Captures: number; p2Captures: number } {
    const startingMarbles = this.startingPieceCount!;
    const winningScore = this.winningScore!;
    return {
      p1Captures: Math.max(0, Math.min(startingMarbles - board.p2.size(), winningScore)),
      p2Captures: Math.max(0, Math.min(startingMarbles - board.p1.size(), winningScore)),
    };
  }

  static writeFen(board: Board): string {
    const cells = this.getCellList();
    let fen = '';
    let empty = 0;
    let prevY: number | undefined = undefined;
    for (const pos of cells) {
      const [, y] = pos;
      if (prevY !== undefined && y !== prevY) {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += '/';
      }
      prevY = y;
      const piece = this.getPiece(board, pos);
      if (piece) {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += piece.playerIndex === 'p1' ? 'S' : 's';
      } else {
        empty++;
      }
    }
    if (empty > 0) fen += empty;
    return fen;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false; // Having only one remaining piece for each player could be considered as insufficient material, but never happens from an official starting position
  }

  protected override validate(): Result<undefined, PositionError> {
    return this.board.occupied.isEmpty()
      ? Result.err(new PositionError(IllegalSetup.Empty))
      : Result.ok(undefined);
  }

  override isVariantEnd(): boolean {
    return !!this.variantOutcome();
  }

  override variantOutcome(ctx?: Context): Outcome | undefined {
    const cls = this.constructor as typeof GameFamily;
    const winScore = cls.winningScore!;
    if (this.p1Captures >= winScore) return { winner: 'p1' };
    if (this.p2Captures >= winScore) return { winner: 'p2' };
    if (ctx && !this.hasDests(ctx)) return { winner: opposite(this.turn) };
    return undefined;
  }

  //
  //
  static getMaxUsable(): number | undefined {
    return 3;
  }

  static hasPrevPlayer(): boolean {
    return false;
  }

  //
  // Cells
  static getCentre(): Pos {
    return [Math.floor(this.width / 2), Math.floor(this.height / 2)];
  }

  static isCell(pos: Pos): boolean {
    return this.isCellCore(this.getCentre(), pos);
  }

  static isCellCore(centre: Pos, pos: Pos): boolean {
    return dist(centre, pos) <= centre[0];
  }

  static getCellList(): Pos[] {
    const centre = this.getCentre();
    const res: Pos[] = [];

    for (let y = this.height - 1; y >= 0; y--) {
      for (let x = 0; x < this.width; x++) {
        const pos: Pos = [x, y];
        if (this.isCellCore(centre, pos)) res.push(pos);
      }
    }

    return res;
  }

  //
  // Notation
  static override getNotationStyle(): NotationStyle {
    return NotationStyle.abl;
  }

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    return this.computeMoveNotationCore(move, MoveNotation.PlayStrategy);
  }

  protected static computeMoveNotationCore(move: ExtendedMoveInfo, notation: MoveNotation): string {
    const board = this.readFen_board(move.prevFen);

    if (board.isOk) {
      const m = this.uciToMove(move), from = m[0], cFrom = this.getPiece(board.value, from);

      if (cFrom !== undefined) {
        let to = m[1];
        const vect = sub(to, from);
        let n = norm(vect);

        if (n > 0) {
          const uvect = div(n, vect),
            neighVectors = getNeighVectors();

          return includes(neighVectors, uvect)
            ? this.computeMoveNotationCore_line(notation, board.value, neighVectors, from, to, vect, n, uvect, cFrom) // In-line move
            : this.computeMoveNotationCore_jump(notation, board.value, neighVectors, from, to, vect, n, uvect, cFrom); // Broadside move
        }
      }
    }

    return this.computeMoveNotation_unknown();
  }

  protected static computeMoveNotationCore_line(
    notation: MoveNotation,
    board: Board,
    _neighVectors: Pos[],
    from: Pos,
    to: Pos,
    _vect: Pos,
    _n: number,
    uvect: Pos,
    cFrom: Piece,
  ): string {
    let sep = '';

    switch (notation) {
      default:
      case MoveNotation.AbaPro:
        to = add(from, uvect);
        break;
      case MoveNotation.Nacre: {
        to = from;
        while (this.getPiece(board, to) === cFrom) to = add(to, uvect);
        break;
      }
      case MoveNotation.Nacre_extended: {
        const tto = to;
        to = from;

        while (this.getPiece(board, to) !== undefined) to = add(to, uvect);

        if (areEqual(from, to)) to = tto;
        break;
      }
      case MoveNotation.PlayStrategy: {
        const tto = to;
        to = from;

        while (this.getPiece(board, to) !== undefined) to = add(to, uvect);

        if (areEqual(from, to)) to = tto;
        else if (!this.isCell(to)) { // Ejection
          to = sub(to, uvect);
          sep = 'x';
        }
        break;
      }
    }

    return pos2key(from) + sep + pos2key(to);
  }

  protected static computeMoveNotationCore_jump(
    notation: MoveNotation,
    board: Board,
    neighVectors: Pos[],
    from: Pos,
    to: Pos,
    vect: Pos,
    n: number,
    _uvect: Pos,
    cFrom: Piece,
  ): string {
    switch (notation) {
      default:
        return pos2key(from) + pos2key(to); // Assumes (correctly) the two positions are not reversed
      case MoveNotation.AbaPro: {
        n--;
        let found = false, vvect: Pos = [0, 0], _nvect: Pos = [0, 0];

        for (const _vect of neighVectors) {
          _nvect = mult(n, _vect);

          if (this.getPiece(board, add(from, _nvect)) === cFrom) {
            vvect = getNextCore(neighVectors, _vect);

            if (areEqual(add(_nvect, vvect), vect)) {
              found = true;
              break;
            } else {
              vvect = getPrevCore(neighVectors, _vect);

              if (areEqual(add(_nvect, vvect), vect)) {
                found = true;
                break;
              }
            }
          }
        }

        if (found) return pos2key(from) + pos2key(add(from, _nvect)) + pos2key(add(from, vvect));
      }
    }

    return this.computeMoveNotation_unknown();
  }

  protected static computeMoveNotation_unknown(): string {
    return '?';
  }

  static uciToMove(move: ExtendedMoveInfo): [Pos, Pos] {
    const reg = matchKeys(move.uci);
    return [key2pos(reg[0]), key2pos(reg[1])];
  }

  //
  // FEN
  static override readFen(
    fen: string,
    _ranks: number,
    _files: number,
  ): Result<[Board, number, number, PlayerIndex, number, number, number], FenError> {
    const [boardPart, ...parts] = fen.split(' ');
    if (parts.length < 5) return Result.err(new FenError(InvalidFen.Fen));

    return fp.resultZip([
      this.readFen_board(boardPart),
      parseScore(parts[0]),
      parseScore(parts[1]),
      parsePlayerTurn('b', 'w')(parts[2]),
      parseHalfMoves(parts[3]),
      parseFullMoves(parts[4]),
      parsePliesRemainingThisTurn(parts.length < 6 ? undefined : parts[5]),
    ]);
  }

  protected static readFen_board(fen: string): Result<Board, FenError> {
    const board = Board.empty(this.rules),
      cells = this.getCellList();

    let k = 0;
    for (let i = 0; i < fen.length; i++) {
      const c = fen[i];

      if (c === ' ') break;
      else if (c !== '/') {
        let reg = fen.substring(i).match(/^[1-9][0-9]*/g);

        if (reg !== null && reg.length > 0) {
          k += parseInt(fen.substring(i, i + reg[0].length));
          i += reg[0].length - 1;
        } else {
          const piece = charToPiece(c);
          if (!piece || k >= cells.length) return Result.err(new FenError(InvalidFen.Board));

          this.setPiece(board, cells[k++], piece);
        }
      }
    }

    return Result.ok(board);
  }

  protected static getPiece(board: Board, pos: Pos): Piece | undefined {
    const i = this.getFenIndex(pos);
    return i !== undefined ? board.get(i) : undefined;
  }

  protected static setPiece(board: Board, pos: Pos, piece: Piece): void {
    const i = this.getFenIndex(pos);
    if (i !== undefined) board.set(i, piece);
  }

  protected static getFenIndex(pos: Pos): number | undefined {
    return pos[0] < 0 || pos[1] < 0 ? undefined : pos[0] + pos[1] * this.width;
  }

  static fenSetupFromTuple([board, p1Captures, p2Captures, turn, halfmoves, fullmoves]: [
    Board,
    number,
    number,
    PlayerIndex,
    number,
    number,
    number,
  ]): Setup {
    return { ...defaultSetup(), board, p1Captures, p2Captures, turn, halfmoves, fullmoves };
  }
}
