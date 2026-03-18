import { Result } from '@badrap/result';
import { Board } from '../../board';
import { Castles, Chess, PositionError } from '../../chess';
import { Option } from '../../fp';
import { Setup } from '../../setup';
import { type Move, type NormalMove, type Piece, type Rules } from '../../types';
import { defined } from '../../util';
import { GameFamily } from './GameFamily';

export class Monster extends GameFamily {
  lastMove?: Option<Move>;
  static override rules: Rules = 'monster';
  static override standardInitialPosition: boolean = false;

  static override default(): Monster {
    const pos = new this();
    pos.board = Board.monster();
    pos.pockets = undefined;
    pos.turn = 'p1';
    pos.castles = Castles.default();
    pos.castles.discardSide('p1');
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static override fromSetup(setup: Setup): Result<Monster, PositionError> {
    const pos = new this();
    pos.board = setup.board.clone();
    pos.turn = setup.turn;
    const castles = Chess.fromSetup(setup).unwrap(
      (chess) => chess.castles,
      () => Castles.empty(),
    );
    pos.castles = castles;
    pos.epSquare = setup.epSquare ?? undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = setup.halfmoves;
    pos.fullmoves = setup.fullmoves;
    pos.lastMove = setup.lastMove;
    if (defined(pos.lastMove)) {
      const move = pos.lastMove as NormalMove;
      const piece: Piece | undefined = pos.board.get(move.from);
      pos.play(move);
      if (move.from === move.to && defined(piece)) {
        pos.board.set(move.to, piece); // restore the piece
      }
      pos.halfmoves -= 1;
      pos.turn = 'p1';
    }
    return pos.validate()
      .map(
        () => pos,
        (err) => err,
      ) as Result<Monster, PositionError>;
  }

  static override getClass() {
    return this;
  }

  static override getInitialBoardFen(): string {
    return 'rnbqkbnr/pppppppp/8/8/8/8/2PPPP2/4K3';
  }

  static override getInitialEpd(): string {
    return `w kq -`;
  }

  protected constructor() {
    super('monster');
  }

  override clone(): Monster {
    return super.clone() as Monster;
  }

  override toSetup(): Setup {
    return {
      board: this.board.clone(),
      pockets: undefined,
      turn: this.turn,
      unmovedRooks: this.castles.unmovedRooks,
      epSquare: this.epSquare && !this.lastMove ? this.epSquare : undefined,
      remainingChecks: undefined,
      halfmoves: this.halfmoves,
      fullmoves: this.fullmoves,
      lastMove: this.lastMove ? { ...this.lastMove } : undefined,
    };
  }
}
