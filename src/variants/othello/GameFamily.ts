import { Result } from '@badrap/result';
import { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import { type DropMove, type Piece, type PlayerIndex, PLAYERINDEXES, type Square } from '../../types';
import { opposite } from '../../util';
import { type ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.flipello;

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    if (!move.uci.includes('@')) return 'PASS';

    const reg = move.uci.match(/[a-zA-Z][1-9@]0?/g) as string[];
    const dest = reg[1];

    // convert into flipello notation - a1 is top left for first player (not bottom left)
    const newRank = 9 - parseInt(dest.slice(1));
    const destPos = dest[0] + newRank;

    return `${destPos}`;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getInitialEpd(): string {
    return `b - -`;
  }

  static override getEmptyEpd(): string {
    return `b - -`;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.dpo;
  }

  static override getScoreFromFen(fen: string, playerIndex: string): number | undefined {
    const boardPart = fen.split(' ')[0].split('[')[0];
    return boardPart.split(playerIndex === 'p1' ? 'P' : 'p').length - 1;
  }

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.flipello,
      VariantKey.flipello10,
    ];
  }

  readonly directions2D = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
  ];

  readonly initialPieces: Record<Square, Piece> = {
    27: {
      role: `p-piece`,
      playerIndex: PLAYERINDEXES[0],
    } as Piece,
    28: {
      role: `p-piece`,
      playerIndex: PLAYERINDEXES[1],
    } as Piece,
    35: {
      role: `p-piece`,
      playerIndex: PLAYERINDEXES[1],
    } as Piece,
    36: {
      role: `p-piece`,
      playerIndex: PLAYERINDEXES[0],
    } as Piece,
  };

  protected override validateVariant(): Result<undefined, PositionError> {
    for (const [squareStr, expectedPiece] of Object.entries(this.initialPieces)) {
      const square = parseInt(squareStr, 10) as Square;
      const actualPiece = this.board.get(square);
      if (actualPiece?.playerIndex !== expectedPiece.playerIndex || actualPiece?.role !== expectedPiece.role) {
        return Result.err(
          new PositionError(`Invalid initial piece at ${square}: expected ${expectedPiece}, found ${actualPiece}`),
        );
      }
    }

    return Result.ok(undefined);
  }

  override isStalemate(): boolean {
    return false;
  }

  override play(move: DropMove): void {
    this.epSquare = undefined;
    this.halfmoves += 1;
    if (this.turn === 'p2') this.fullmoves += 1;
    this.flipPieces(move);
    this.turn = opposite(this.turn);
  }

  protected flipPieces(move: DropMove): void {
    const turn = this.turn;
    const opponent = opposite(turn);
    const toFlip: Square[] = [];

    const width = (this.constructor as typeof GameFamily).width;
    const height = (this.constructor as typeof GameFamily).height;

    if (move.role) { // might be "pass", in such a case there is no role
      this.board.set(move.to, { role: move.role, playerIndex: turn });

      for (const [dx, dy] of this.directions2D) {
        const line: Square[] = [];

        let x = move.to % width;
        let y = Math.floor(move.to / height);

        while (x >= 0 && x < width && y >= 0 && y < height) {
          x += dx;
          y += dy;

          const pos: Square = (y * height + x) as Square;
          const piece = this.board.get(pos);

          if (!piece) {
            break;
          }
          if (piece.playerIndex === opponent) {
            line.push(pos);
          } else if (piece.playerIndex === turn) {
            toFlip.push(...line);
            break;
          }
        }
      }

      for (const pos of toFlip) {
        const piece = this.board.get(pos);
        if (piece) {
          this.board.set(pos, { ...piece, playerIndex: turn });
        }
      }
    }
  }

  override clone(): GameFamily {
    return super.clone() as GameFamily;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
