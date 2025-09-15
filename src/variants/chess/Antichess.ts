import { Result } from '@badrap/result';
import { Castles, Context, IllegalSetup, PositionError } from '../../chess';
import { Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import { Outcome, PlayerIndex, Rules, Square } from '../../types';
import { opposite } from '../../util';
import { GameFamily } from './GameFamily';

export class Antichess extends GameFamily {
  static override rules: Rules = 'antichess';

  static override default(): Antichess {
    const pos = super.default();
    pos.castles = Castles.empty();
    return pos as Antichess;
  }

  static override fromSetup(setup: Setup): Result<Antichess, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.castles = Castles.empty();
      return pos as Antichess;
    });
  }

  static override getClass() {
    return this;
  }

  static override getInitialEpd(): string {
    return `${this.playerFENChars['p1']} - -`;
  }

  protected constructor() {
    super('antichess');
  }

  protected override kingAttackers(_square: Square, _attacker: PlayerIndex, _occupied: SquareSet): SquareSet {
    return SquareSet.empty();
  }

  protected override validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (SquareSet.backranks64().intersects(this.board['p-piece'])) {
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    }
    return Result.ok(undefined);
  }

  override clone(): Antichess {
    return super.clone() as Antichess;
  }

  override ctx(): Context {
    const ctx = super.ctx();
    const enemy = this.board[opposite(this.turn)];
    for (const from of this.board[this.turn]) {
      if (this.pseudoDests(from, ctx).intersects(enemy)) {
        ctx.mustCapture = true;
        break;
      }
    }
    return ctx;
  }

  override dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();
    const dests = this.pseudoDests(square, ctx);
    if (!ctx.mustCapture) return dests;
    return dests.intersect(this.board[opposite(this.turn)]);
  }

  override hasInsufficientMaterial(playerIndex: PlayerIndex): boolean {
    if (this.board.occupied.equals(this.board['b-piece'])) {
      const weSomeOnLight = this.board[playerIndex].intersects(SquareSet.lightSquares64());
      const weSomeOnDark = this.board[playerIndex].intersects(SquareSet.darkSquares64());
      const theyAllOnDark = this.board[opposite(playerIndex)].isDisjoint(SquareSet.lightSquares64());
      const theyAllOnLight = this.board[opposite(playerIndex)].isDisjoint(SquareSet.darkSquares64());
      return (weSomeOnLight && theyAllOnDark) || (weSomeOnDark && theyAllOnLight);
    }
    return false;
  }

  override isVariantEnd(): boolean {
    return this.board[this.turn].isEmpty();
  }

  override variantOutcome(ctx?: Context): Outcome | undefined {
    ctx = ctx || this.ctx();
    if (ctx.variantEnd || this.isStalemate(ctx)) {
      return { winner: this.turn };
    }
    return;
  }
}
