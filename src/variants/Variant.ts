import { Result } from '@badrap/result';
import { Board } from '../board';
import { Chess, IllegalSetup, PositionError } from '../chess';
import {
  boardAndPocketStrings,
  FenError,
  InvalidFen,
  parseBoardAndOptPockets,
  parseCastlingFen,
  parseFenSquare,
  parseFullMoves,
  parseHalfMoves,
  parseLastMove,
  parseRemainingChecksOpt,
} from '../fen';
import * as fp from '../fp';
import type { Setup } from '../setup';
import { type BoardDimensions, PlayerIndex, PLAYERINDEXES, type Role, RULES, type Rules } from '../types';
import { ExtendedMoveInfo, GameFamilyKey, Key, LexicalUci, NotationStyle, ParsedMove, VariantKey } from './types';

// This class is to allow us to benefit from the Chess class for other games even though all their own logic is still not fully implemented.
export abstract class Variant extends Chess {
  static height: BoardDimensions['ranks'] = 8;
  static width: BoardDimensions['files'] = 8;
  static rules: Rules = 'chess';
  static family: GameFamilyKey = GameFamilyKey.chess;

  // @TODO: this is supposed to represent the js version of SG but the value is currently only correctly set for chess variants.
  static standardInitialPosition: boolean = true;

  static computeMoveNotation(move: ExtendedMoveInfo): string {
    return move.san[0] === 'P' ? move.san.slice(1) : move.san;
  }

  static defaultBoard(pos: Variant) {
    pos.board = Board.default();
    pos.turn = 'p1';
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static emptyBoard(): Board {
    const pos = Board.empty('chess');
    return pos;
  }

  static getBoardDimensions(): BoardDimensions {
    return { files: this.width, ranks: this.height };
  }

  static getEmptyBoardFen(): string {
    return '8/8/8/8/8/8/8/8';
  }

  static getInitialBoardFen(): string {
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  }

  static getEmptyFen(): string {
    return `${this.getEmptyBoardFen()} ${this.getEmptyEpd()} ${this.getInitialMovesFen()}`;
  }

  static getInitialEpd(): string {
    return 'w - -';
  }

  static getEmptyEpd(): string {
    return `w - -`;
  }

  static getInitialMovesFen(): string {
    return '0 1';
  }

  static getInitialFen(): string {
    return `${this.getInitialBoardFen()} ${this.getInitialEpd()} ${this.getInitialMovesFen()}`;
  }

  static getClass() {
    return this;
  }

  static getScoreFromFen(_fen: string, _playerIndex: string): number | undefined {
    return undefined;
  }

  static getNotationStyle(): NotationStyle {
    return NotationStyle.san;
  }

  static getVariantKeys(): VariantKey[] {
    return Object.values(VariantKey);
  }

  static parseLexicalUci(uci: string): LexicalUci | undefined {
    if (!uci) return undefined;
    const pos = uci.match(/[a-z][1-9][0-9]?/g) as Key[];

    if (uci[1] === '@') {
      return {
        from: pos[0],
        to: pos[0],
        dropRole: `${uci[0].toLowerCase()}-piece` as Role,
      };
    }

    // e7e8Q
    let promotion: Role | undefined = undefined;

    const uciToFrom = `${pos[0]}${pos[1]}`;
    if (uci.startsWith(uciToFrom) && uci.length == uciToFrom.length + 1) {
      promotion = `${uci[uci.length - 1]}-piece` as Role;
    }

    return {
      from: pos[0],
      to: pos[1],
      promotion,
    };
  }

  static parseFen(fen: string): Result<Setup, FenError> {
    const [boardPart, ...originalParts] = fen.split(' ');
    const lastMoveParts = originalParts.filter(f => f.includes('½'));
    const parts = originalParts.filter(f => !f.includes('½'));

    if (parts.length > 6) {
      return Result.err(new FenError(InvalidFen.Fen));
    }

    const hasEarlyRemainingChecks = parts.length > 3 ? parts[3].includes('+') : false;

    // Board and pockets
    return boardAndPocketStrings(this.rules)(boardPart)
      .chain(parseBoardAndOptPockets(this.rules))
      .chain(({ board, pockets }) => {
        return fp
          .resultZip([
            fp.pipe(this.parsePlayerTurn(parts[0])),
            parseCastlingFen(board)(parts[1]),
            parseFenSquare(this.rules)(parts[2]),
            parseRemainingChecksOpt(hasEarlyRemainingChecks ? parts[3] : parts[5]),
            parseHalfMoves(hasEarlyRemainingChecks ? parts[4] : parts[3]),
            parseFullMoves(hasEarlyRemainingChecks ? parts[5] : parts[4]),
            parseLastMove(this.rules)(lastMoveParts[0]),
          ])
          .map(([turn, unmovedRooks, epSquare, remainingChecks, halfmoves, fullmoves, lastMove]) => ({
            board,
            pockets,
            turn,
            unmovedRooks,
            remainingChecks,
            epSquare,
            halfmoves,
            fullmoves: Math.max(1, fullmoves),
            lastMove,
          }));
      });
  }

  static parsePlayerTurn(turnPart: fp.Option<string>, p1Char = 'w', p2Char = 'b'): Result<PlayerIndex, FenError> {
    return fp.pipe(
      turnPart,
      fp.Option.fold(
        (turnPart: string) =>
          turnPart.toLowerCase() === p1Char.toLowerCase()
            ? Result.ok('p1')
            : turnPart.toLowerCase() === p2Char.toLowerCase()
            ? Result.ok('p2')
            : Result.err(new FenError(InvalidFen.Turn)),
        () => Result.ok('p1'),
      ),
    );
  }

  static parseUciToUsi(uci: string, files: number, ranks: number): ParsedMove {
    // account for ranks going up to 10, files are just a letter
    const reg = uci.match(/[a-zA-Z][1-9@]0?/g) as string[];
    return {
      orig: this.parseUCISquareToUSI(reg[0], files, ranks)!,
      dest: this.parseUCISquareToUSI(reg[1], files, ranks)!,
    };
  }

  static parseUCISquareToUSI(str: string, files: number, ranks: number): string | undefined {
    if (str.length > 3) return;
    const file = files - Math.abs(str.charCodeAt(0) - 'a'.charCodeAt(0));
    const rank = ranks + 1 - parseInt(str.slice(1));
    if (file < 1 || file > files || rank < 1 || rank > ranks) return;
    return file.toString() + rank.toString();
  }

  static patchFairyUci(move: string, _fen: string) {
    return move;
  }

  /*
   ** reads in a fen and outputs a map of board pieces - coordinates/keys are that of a shogi board [file+rank]
   */
  static readFen(fen: string, ranks: number, files: number): any {
    const parts = fen.split(' '),
      board: any = {
        pieces: {},
        wMoved: parts[1] === 'b',
      };

    parts[0]
      .split('[')[0]
      .split('/')
      .slice(0, ranks)
      .forEach((row, y) => {
        let x = files;
        let promoted = false;
        row.split('').forEach(v => {
          if (v == '~') return;
          const nb = parseInt(v, 10);
          if (nb) x -= nb;
          else if (v == '+') promoted = true;
          else {
            if (promoted) {
              board.pieces[`${x}${y + 1}`] = '+' + v;
            } else {
              board.pieces[`${x}${y + 1}`] = v;
            }
            x--;
            promoted = false;
          }
        });
      });

    return board;
  }

  static validSetup(setup: Setup, pos: Variant): Result<Variant, PositionError> {
    pos.board = setup.board.clone();
    pos.turn = setup.turn;
    pos.halfmoves = setup.halfmoves;
    pos.fullmoves = setup.fullmoves;
    return pos.validate().map(_ => pos);
  }

  protected constructor(game: Rules) {
    super(game);
  }

  protected override validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));

    let player1HasPieces = false;
    let player2HasPieces = false;
    for (const square of this.board.occupied) {
      const piece = this.board.get(square);
      if (piece?.playerIndex === PLAYERINDEXES[0]) {
        player1HasPieces = true;
      }
      if (piece?.playerIndex === PLAYERINDEXES[1]) {
        player2HasPieces = true;
      }
      if (player1HasPieces && player2HasPieces) {
        break;
      }
    }
    if (!player1HasPieces) {
      return Result.err(new PositionError(IllegalSetup.Empty));
    }
    if (!player2HasPieces) {
      return Result.err(new PositionError(IllegalSetup.Empty));
    }

    return this.validateVariant();
  }

  // @Note: override this method in subclasses to implement variant-specific validation logic.
  protected validateVariant(): Result<undefined, PositionError> {
    return Result.ok(undefined);
  }

  override clone(): Variant {
    return super.clone() as Variant;
  }
}
