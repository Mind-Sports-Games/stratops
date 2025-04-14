import type { Result } from '@badrap/result';
import { Board } from '../board';
import { Chess, type PositionError } from '../chess';
import type { Setup } from '../setup';
import type { BoardDimensions, Rules } from '../types';
import type { ParsedMove } from './interfaces';

// This class is to allow us to benefit from the Chess class for other games even though all their own logic is still not fully implemented.
export abstract class Variant extends Chess {
  static height: BoardDimensions['ranks'] = 8;
  static width: BoardDimensions['files'] = 8;

  static defaultBoard(pos: Variant) {
    pos.board = Board.default();
    pos.turn = 'p1';
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static getBoardDimensions(): BoardDimensions {
    return { files: this.width, ranks: this.height };
  }

  static getClass() {
    return this;
  }

  static getScoreFromFen(_fen: string, _playerIndex: string): number | undefined {
    return undefined;
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

  override clone(): Variant {
    return super.clone() as Variant;
  }
}
