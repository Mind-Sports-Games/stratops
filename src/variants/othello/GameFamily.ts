import { Result } from '@badrap/result';
import { Context, PositionError } from '../../chess';
import type { Setup } from '../../setup';
import { type DropMove, Outcome, type Piece, type PlayerIndex, PLAYERINDEXES, type Square } from '../../types';
import { opposite } from '../../util';
import { type ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.flipello;
  static override playersColors: Record<PlayerIndex, string> = {
    p1: 'black',
    p2: 'white',
  };
  static override playersChars: Record<PlayerIndex, string> = {
    p1: 'b',
    p2: 'w',
  };

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

  protected override validateVariant(): Result<undefined, PositionError> {
    // check if the initial square of pieces still contains pieces
    const width = (this.constructor as typeof GameFamily).width;
    const height = (this.constructor as typeof GameFamily).height;

    const centerRows = height % 2 === 0
      ? [height / 2 - 1, height / 2]
      : [Math.floor(height / 2)];
    const centerCols = width % 2 === 0
      ? [width / 2 - 1, width / 2]
      : [Math.floor(width / 2)];

    for (const row of centerRows) {
      for (const col of centerCols) {
        if (!this.board.get(row * width + col)) {
          return Result.err(new PositionError(`Initial square at (${col + 1}, ${row + 1}) is empty.`));
        }
      }
    }

    return Result.ok(undefined);
  }

  override clone(): GameFamily {
    return super.clone() as GameFamily;
  }

  // no piece on the board for a player, or all squares occupied
  override isVariantEnd(): boolean {
    const width = (this.constructor as typeof GameFamily).width;
    const height = (this.constructor as typeof GameFamily).height;
    if (this.board.occupied.size() === width * height) return true;

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
    if (!player1HasPieces || !player2HasPieces) {
      return true;
    }

    return false;
  }

  // @Note : for now we do not need to correctly determine the winner, isVariantEnd only is used to determine if the game is over or not from board editor page
  override variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;

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
      return { winner: 'p1' };
    }
    if (!player2HasPieces) {
      return { winner: 'p2' };
    }

    return { winner: undefined };
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
