import { Result } from '@badrap/result';
import type { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { PlayerIndex } from '../../types';
import {
  type ExtendedMoveInfo,
  GameFamilyKey,
  LegacyNotationBoard,
  NotationStyle,
  type ParsedMove,
  VariantKey,
} from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.abalone;

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    const reg = move.uci.match(/[a-i][1-9]/g) as string[],
      parsed = this.parseUciToAbl(move.uci),
      orig = reg[0],
      dest = reg[1],
      board = this.readAbaloneFen(move.fen, this.height, this.width),
      prevBoard = this.readAbaloneFen(move.prevFen, this.height, this.width),
      keyDiffs = this.diffAbaloneBoard(board, prevBoard),
      isPush = new Set(keyDiffs[0].concat(keyDiffs[1])).size != keyDiffs[0].concat(keyDiffs[1]).length,
      oppPushedTo = keyDiffs[1].filter(k => k !== dest),
      isCapture =
        move.fen.split(' ')[1] + move.fen.split(' ')[2] != move.prevFen.split(' ')[1] + move.prevFen.split(' ')[2],
      is3v2Capture = isCapture && !this.isOnEdgeAbaloneBoard(dest);

    const destNotation = isPush
      ? isCapture
        ? is3v2Capture
          ? this.parseUCISquareToAbl(this.findEdgeFromAbaloneMove(orig, dest))
          : parsed.dest
        : this.parseUCISquareToAbl(oppPushedTo[0])
      : parsed.dest;

    return `${parsed.orig}${isCapture ? 'x' : ''}${destNotation}`;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.abl;
  }

  static override getScoreFromFen(fen: string, playerIndex: string): number | undefined {
    return +fen.split(' ')[playerIndex === 'p1' ? 1 : 2];
  }

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.backgammon,
      VariantKey.hyper,
      VariantKey.nackgammon,
    ];
  }

  static diffAbaloneBoard(board: LegacyNotationBoard, prevBoard: LegacyNotationBoard): [string[], string[]] {
    const turnPlayerChanges = Object.keys(prevBoard.pieces).filter(k => prevBoard.pieces[k] !== board.pieces[k]);
    const oppChanges = Object.keys(board.pieces).filter(k => prevBoard.pieces[k] !== board.pieces[k]);
    return [turnPlayerChanges, oppChanges];
  }

  static findEdgeFromAbaloneMove(orig: string, dest: string): string {
    // same letter (\)
    if (orig[0] == dest[0]) {
      if (parseInt(orig[1]) > parseInt(dest[1])) {
        return orig[0] + Math.max(orig[0].charCodeAt(0) - 96 - 4, 1).toString();
      } else return orig[0] + Math.min(orig[0].charCodeAt(0) - 96 + 4, 9).toString();
    }
    // same number (-)
    if (orig[1] == dest[1]) {
      if (orig[0].charCodeAt(0) > dest[0].charCodeAt(0)) {
        return String.fromCharCode(Math.max(parseInt(orig[1]) + 96 - 4, 97)) + orig[1];
      } else return String.fromCharCode(Math.min(parseInt(orig[1]) + 96 + 4, 105)) + orig[1];
    }
    // other direction (/)
    if (Math.abs(parseInt(dest[1]) + dest[0].charCodeAt(0) - (parseInt(orig[1]) + orig[0].charCodeAt(0))) % 2 == 0) {
      if (parseInt(orig[1]) + orig[0].charCodeAt(0) > parseInt(dest[1]) + dest[0].charCodeAt(0)) {
        return String.fromCharCode(dest[0].charCodeAt(0) - 1) + (parseInt(dest[1]) - 1).toString();
      } else return String.fromCharCode(dest[0].charCodeAt(0) + 1) + (parseInt(dest[1]) + 1).toString();
    }
    return 'a1';
  }

  static isOnEdgeAbaloneBoard(dest: string): boolean {
    return (
      dest[0] == 'a'
      || dest[0] == 'i'
      || dest[1] == '1'
      || dest[1] == '9'
      || ['b6', 'c7', 'd8', 'f2', 'g3', 'h4'].includes(dest)
    );
  }

  static parseUCISquareToAbl(str: string): string | undefined {
    if (str.length > 2) return;
    const numberPart = 1 + Math.abs(str.charCodeAt(0) - 'a'.charCodeAt(0));
    const letterPart = String.fromCharCode(parseInt(str.slice(1)) + 96);
    return letterPart.toString() + numberPart.toString();
  }

  static parseUciToAbl(uci: string): ParsedMove {
    const reg = uci.match(/[a-i][1-9]/g) as string[];
    return {
      orig: this.parseUCISquareToAbl(reg[0])!,
      dest: this.parseUCISquareToAbl(reg[1])!,
    };
  }

  static readAbaloneFen(fen: string, ranks: number, files: number) {
    const parts = fen.split(' '),
      board: LegacyNotationBoard = {
        pieces: {},
        wMoved: parts[3] === 'b',
      };

    parts[0]
      .split('[')[0]
      .split('/')
      .slice(0, ranks)
      .forEach((row, y) => {
        let x = Math.max(files - y - 4, 1);
        row.split('').forEach(v => {
          if (v == '~') return;
          const nb = parseInt(v, 10);
          if (nb) x += nb;
          else {
            board.pieces[`${String.fromCharCode(x + 96)}${files - y}`] = v;
            x++;
          }
        });
      });

    return board;
  }

  protected override validate(): Result<undefined, PositionError> {
    return Result.ok(undefined);
  }

  override clone(): GameFamily {
    return super.clone() as GameFamily;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false; // having only 1 piece alive for each player could be considered as insufficient material
  }
}
