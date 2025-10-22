import type { Result } from '@badrap/result';
import { Castles, type PositionError } from '../../chess';
import { Option } from '../../fp';
import { Material, type Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import type { BoardDimensions, Move, NormalMove, Rules } from '../../types';
import { defined } from '../../util';
import { GameFamily } from './GameFamily';

export class Amazons extends GameFamily {
  lastMove?: Option<Move>;
  static override height: BoardDimensions['ranks'] = 10;
  static override width: BoardDimensions['files'] = 10;
  static override rules: Rules = 'amazons';

  static override default(): Amazons {
    const pos = super.default();
    return pos as Amazons;
  }

  static fixFenForLastMove(fen: string, lastMove?: Move): string {
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

  static override fromSetup(setup: Setup): Result<Amazons, PositionError> {
    const pos = new this();
    pos.board = setup.board.clone();
    if (setup.pockets) {
      pos.pockets = new Material(setup.pockets.p1, setup.pockets.p2);
    }
    pos.turn = setup.turn;
    pos.castles = Castles.empty();
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = setup.halfmoves;
    pos.fullmoves = setup.fullmoves;
    pos.lastMove = setup.lastMove;
    if (defined(pos.lastMove)) {
      const move = pos.lastMove as NormalMove;
      pos.play(pos.lastMove);
      pos.fullmoves -= 1;
      pos.halfmoves -= 1;
      if (pos.turn === 'p1') pos.turn = 'p2';
      else pos.turn = 'p1';
    }
    return pos.validate().map(_ => pos) as Result<Amazons, PositionError>;
  }

  static override getEmptyBoardFen(): string {
    return '10/10/10/10/10/10/10/10/10/10';
  }

  static override getInitialBoardFen(): string {
    return '3q2q3/10/10/q8q/10/10/Q8Q/10/10/3Q2Q3/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp';
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('amazons');
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
}
