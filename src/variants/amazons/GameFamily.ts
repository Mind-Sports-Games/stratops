import { Result } from '@badrap/result';
import { PositionError } from '../../chess';
import { Option } from '../../fp';
import { Material, type Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import { type Move, type NormalMove, type PlayerIndex, PLAYERINDEXES } from '../../types';
import { defined } from '../../util';
import { ExtendedMoveInfo, GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  lastMove?: Option<Move>;
  static override family: GameFamilyKey = GameFamilyKey.amazons;

  static algebraicToIndex(coord: string): number {
    const fileLetter = coord[0];
    const rank = Number(coord.slice(1));
    const file = fileLetter.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
    return (rank - 1) * this.width + (file - 1);
  }

  static fixFenForLastAction(fen: string, lastMove?: Move): string {
    const fenParts = fen.split(' ');
    if (fenParts.length === 7) {
      if (lastMove) {
        const turnChar = fenParts[1];
        const turn = turnChar === this.playerFENChars['p1']
          ? 'p1'
          : turnChar === this.playerFENChars['p2']
          ? 'p2'
          : 'p1';
        const pieces = this.getPiecesCoordinates(fenParts[0] + ' ' + fenParts[1], turn).map(
          entry => [entry.coord, entry.piece],
        ).reduce((acc, [coord, piece]) => {
          acc[coord] = piece;
          return acc;
        }, {} as Record<string, string>);
        const move = lastMove as NormalMove;
        const from = move.from.toString();
        const to = move.to.toString();
        if (
          defined(pieces[this.indexToAlgebraic(to)]) && this.isPieceOfPlayer(pieces[this.indexToAlgebraic(to)], turn)
        ) {
          fenParts[fenParts.length - 1] = `½${this.indexToAlgebraic(from)}${this.indexToAlgebraic(to)}`;
          return fenParts.join(' ');
        }
      }
    }
    return fenParts.slice(0, 6).join(' ');
  }

  static indexToAlgebraic(index: string | number): string {
    const idx = typeof index === 'string' ? parseInt(index, 10) : index;
    const rank = Math.floor(idx / this.width) + 1;
    const file = (idx % this.width) + 1;
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

  static override readFen(fen: string) { // Note: currently only reads pieces and ignores turn, pockets, etc.
    const [piecePart] = fen.split(' ');
    const ranks = piecePart.split('/');
    const pieces: Record<string, string> = {};

    for (let fenRank = 0; fenRank < this.height; fenRank++) {
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
          const boardRank = this.height - fenRank;
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
    const board = this.readFen(fen);
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

  override toSetup(): Setup {
    return {
      board: this.board.clone(),
      pockets: this.pockets ? new Material(this.pockets.p1, this.pockets.p2) : undefined,
      turn: this.turn,
      unmovedRooks: SquareSet.empty(),
      epSquare: undefined,
      remainingChecks: undefined,
      halfmoves: this.halfmoves,
      fullmoves: this.fullmoves,
      lastMove: this.lastMove ? { ...this.lastMove } : undefined,
    };
  }

  // check there is at least one piece per player on the board
  protected override validateVariant(): Result<undefined, PositionError> {
    const piecesPositions = this.board['q-piece'];
    return Option.fold(
      (firstPiecePos: number) => {
        const playerIndex = this.board.get(firstPiecePos)?.playerIndex;
        let missingPlayer = playerIndex === PLAYERINDEXES[0] ? PLAYERINDEXES[1] : PLAYERINDEXES[0];
        for (const pos of piecesPositions) {
          const piece = this.board.get(pos);
          if (!piece) continue;
          if (piece.playerIndex === missingPlayer) {
            return Result.ok(undefined);
          }
        }
        return Result.err(new PositionError(`Not enough pieces for player ${missingPlayer} on the board`));
      },
      () => Result.err(new PositionError('Not enough pieces on the board')),
    )(piecesPositions.first());
  }
}
