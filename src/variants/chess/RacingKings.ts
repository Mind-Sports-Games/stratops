import { Result } from '@badrap/result';
import { kingAttacks } from '../../attacks';
import { Board } from '../../board';
import { Castles, Context, IllegalSetup, PositionError } from '../../chess';
import { Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import { Outcome, PlayerIndex, Rules, Square } from '../../types';
import { defined } from '../../util';
import { GameFamily } from './GameFamily';

export class RacingKings extends GameFamily {
  static override rules: Rules = 'racingkings';
  static override standardInitialPosition: boolean = false;

  static override default(): RacingKings {
    const pos = new this();
    pos.board = Board.racingKings();
    pos.pockets = undefined;
    pos.turn = 'p1';
    pos.castles = Castles.empty();
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static override fromSetup(setup: Setup): Result<RacingKings, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.castles = Castles.empty();
      return pos as RacingKings;
    });
  }

  static override getClass() {
    return this;
  }

  static override getInitialBoardFen(): string {
    return '8/8/8/8/8/8/krbnNBRK/qrbnNBRQ';
  }

  protected constructor() {
    super('racingkings');
  }

  protected override validate(): Result<undefined, PositionError> {
    if (this.isCheck()) return Result.err(new PositionError(IllegalSetup.ImpossibleCheck));
    if (this.board['p-piece'].nonEmpty()) return Result.err(new PositionError(IllegalSetup.Variant));
    return super.validate();
  }

  override clone(): RacingKings {
    return super.clone() as RacingKings;
  }

  override dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();

    // Kings cannot give check.
    if (square === ctx.king) return super.dests(square, ctx);

    // TODO: This could be optimized considerably.
    let dests = SquareSet.empty();
    for (const to of super.dests(square, ctx)) {
      // Valid, because there are no promotions (or even pawns).
      const move = { from: square, to };
      const after = this.clone();
      after.play(move);
      if (!after.isCheck()) dests = dests.with(to);
    }
    return dests;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }

  override isVariantEnd(): boolean {
    const goal = SquareSet.fromRank64(7);
    const inGoal = this.board['k-piece'].intersect(goal);
    if (inGoal.isEmpty()) return false;
    if (this.turn === 'p1' || inGoal.intersects(this.board.p2)) return true;

    // P1 has reached the backrank. Check if p2 can catch up.
    const p2King = this.board.kingOf('p2');
    if (defined(p2King)) {
      const occ = this.board.occupied.without(p2King);
      for (const target of kingAttacks(p2King).intersect(goal).diff64(this.board.p2)) {
        if (this.kingAttackers(target, 'p1', occ).isEmpty()) return false;
      }
    }
    return true;
  }

  override variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;
    const goal = SquareSet.fromRank64(7);
    const p2InGoal = this.board.pieces('p2', 'k-piece').intersects(goal);
    const p1InGoal = this.board.pieces('p1', 'k-piece').intersects(goal);
    if (p2InGoal && !p1InGoal) return { winner: 'p2' };
    if (p1InGoal && !p2InGoal) return { winner: 'p1' };
    return { winner: undefined };
  }
}
