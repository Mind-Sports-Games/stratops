import { Result } from '@badrap/result';
import { Context, PositionError } from '../../chess';
import type { Setup } from '../../setup';
import { type DropMove, Outcome, PlayerFENChar, type PlayerIndex, type Square } from '../../types';
import { opposite } from '../../util';
import { GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.flipello;
  static override playerColors: Record<PlayerIndex, string> = {
    p1: 'black',
    p2: 'white',
  };
  static override playerFENChars: Record<PlayerIndex, PlayerFENChar> = {
    p1: 'w',
    p2: 'b',
  };
  static playableSquareCount(): number {
    return this.width * this.height - this.unplayableSquares.length;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
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
      VariantKey.antiflipello,
      VariantKey.octagonflipello,
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

    for (const square of (this.constructor as typeof GameFamily).unplayableSquares) {
      if (this.board.get(square)) {
        return Result.err(new PositionError(`Square ${square} is outside the board.`));
      }
    }

    return Result.ok(undefined);
  }

  override clone(): GameFamily {
    return super.clone() as GameFamily;
  }

  // Board full, or a player has no disc left.
  override isVariantEnd(): boolean {
    const ctor = this.constructor as typeof GameFamily;
    return (
      this.board.occupied.size() === ctor.playableSquareCount()
      || this.board.p1.isEmpty()
      || this.board.p2.isEmpty()
    );
  }

  override variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;
    const p1 = this.board.p1.size();
    const p2 = this.board.p2.size();
    if (p1 === p2) return { winner: undefined };
    const p1HasMore = p1 > p2;
    return { winner: p1HasMore !== (this.constructor as typeof GameFamily).misere ? 'p1' : 'p2' };
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
