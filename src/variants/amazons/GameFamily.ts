import { Result } from '@badrap/result';
import { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { PlayerIndex } from '../../types';
import { ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.amazons;

  static algebraicToIndex(coord: string, width: number = 10): number {
    const fileLetter = coord[0];
    const rank = Number(coord.slice(1));
    const file = fileLetter.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
    return (rank - 1) * width + (file - 1);
  }

  static indexToAlgebraic(index: string, width: number = 10): string {
    const idx = typeof index === 'string' ? parseInt(index, 10) : index;
    const rank = Math.floor(idx / width) + 1;
    const file = (idx % width) + 1;
    const fileLetter = String.fromCharCode('a'.charCodeAt(0) + file - 1);
    return `${fileLetter}${rank}`;
  }

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    return move.uci[0] === 'P' ? move.uci.slice(1) : move.uci;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.uci;
  }

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.amazons,
    ];
  }

  static override readFen(fen: string, height = 10, _width = 10) { // Note: currently only reads pieces and ignores turn, pockets, etc.
    const [piecePart] = fen.split(' ');
    const ranks = piecePart.split('/');
    const pieces: Record<string, string> = {};

    for (let fenRank = 0; fenRank < height; fenRank++) {
      const row = ranks[fenRank];
      let file = 1;
      let i = 0;
      while (i < row.length) {
        const char = row[i];
        const digit = parseInt(char, 10);
        if (!isNaN(digit)) {
          file += digit;
          i++;
        } else {
          const boardRank = height - fenRank;
          const coord = `${file}${boardRank}`;
          pieces[coord] = char;
          file++;
          i++;
        }
      }
    }
    return { pieces };
  }

  static override getPiecesCoordinates(fen: string, playerIndex: PlayerIndex): { piece: string; coord: string }[] {
    const result: { piece: string; coord: string }[] = [];
    const board = this.readFen(fen, this.height, this.width);
    for (const [coord, piece] of Object.entries(board.pieces)) {
      if ((piece as string).toLowerCase() === 'q' && this.isPieceOfPlayer(piece as string, playerIndex)) {
        let file: number, rank: number;
        if (coord[0] === '1' && coord[1] === '0') {
          rank = Number(coord.slice(2));
          file = Number(coord.slice(0, 2));
        } else {
          file = Number(coord[0]);
          rank = Number(coord.slice(1));
        }
        const fileLetter = String.fromCharCode('a'.charCodeAt(0) + file - 1);
        result.push({ piece: piece as string, coord: `${fileLetter}${rank}` });
      }
    }
    return result;
  }

  override clone(): GameFamily {
    return super.clone() as GameFamily;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
