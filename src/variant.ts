import { Result } from '@badrap/result';
import { Square, Outcome, PlayerIndex, PLAYERINDEXES, Piece, Rules } from './types';
import { defined, opposite } from './util';
import { between, kingAttacks } from './attacks';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup, RemainingChecks, Material } from './setup';
import { PositionError, Position, IllegalSetup, Context, Castles, Chess } from './chess';

export { Position, PositionError, IllegalSetup, Context, Chess, Castles };

export class Crazyhouse extends Chess {
  protected constructor() {
    super('crazyhouse');
  }

  static default(): Crazyhouse {
    const pos = super.default();
    pos.pockets = Material.empty();
    return pos as Crazyhouse;
  }

  static fromSetup(setup: Setup): Result<Crazyhouse, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.pockets = setup.pockets ? setup.pockets.clone() : Material.empty();
      return pos as Crazyhouse;
    });
  }

  protected validate(): Result<undefined, PositionError> {
    return super.validate().chain(_ => {
      if (this.pockets && (this.pockets.p1['k-piece'] > 0 || this.pockets.p2['k-piece'] > 0)) {
        return Result.err(new PositionError(IllegalSetup.Kings));
      }
      if ((this.pockets ? this.pockets.count() : 0) + this.board.occupied.size() > 64) {
        return Result.err(new PositionError(IllegalSetup.Variant));
      }
      return Result.ok(undefined);
    });
  }

  clone(): Crazyhouse {
    return super.clone() as Crazyhouse;
  }

  hasInsufficientMaterial(playerIndex: PlayerIndex): boolean {
    // No material can leave the game, but we can easily check this for
    // custom positions.
    if (!this.pockets) return super.hasInsufficientMaterial(playerIndex);
    return (
      this.board.occupied.size() + this.pockets.count() <= 3 &&
      this.board['p-piece'].isEmpty() &&
      this.board.promoted.isEmpty() &&
      this.board.rooksAndQueens().isEmpty() &&
      this.pockets.p1['p-piece'] <= 0 &&
      this.pockets.p2['p-piece'] <= 0 &&
      this.pockets.p1['r-piece'] <= 0 &&
      this.pockets.p2['r-piece'] <= 0 &&
      this.pockets.p1['q-piece'] <= 0 &&
      this.pockets.p2['q-piece'] <= 0
    );
  }

  dropDests(ctx?: Context): SquareSet {
    const mask = this.board.occupied
      .complement()
      .intersect(
        this.pockets?.[this.turn].hasNonPawns()
          ? SquareSet.full()
          : this.pockets?.[this.turn].hasPawns()
          ? SquareSet.backranks().complement()
          : SquareSet.empty()
      );

    ctx = ctx || this.ctx();
    if (defined(ctx.king) && ctx.checkers.nonEmpty()) {
      const checker = ctx.checkers.singleSquare();
      if (!defined(checker)) return SquareSet.empty();
      return mask.intersect(between(checker, ctx.king));
    } else return mask;
  }
}

export class Atomic extends Chess {
  protected constructor() {
    super('atomic');
  }

  static default(): Atomic {
    return super.default() as Atomic;
  }

  static fromSetup(setup: Setup): Result<Atomic, PositionError> {
    return super.fromSetup(setup) as Result<Atomic, PositionError>;
  }

  clone(): Atomic {
    return super.clone() as Atomic;
  }

  protected validate(): Result<undefined, PositionError> {
    // Like chess, but allow our king to be missing and any number of checkers.
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (this.board['k-piece'].size() > 2) return Result.err(new PositionError(IllegalSetup.Kings));
    const otherKing = this.board.kingOf(opposite(this.turn));
    if (!defined(otherKing)) return Result.err(new PositionError(IllegalSetup.Kings));
    if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    }
    if (SquareSet.backranks().intersects(this.board['p-piece'])) {
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    }
    return Result.ok(undefined);
  }

  protected kingAttackers(square: Square, attacker: PlayerIndex, occupied: SquareSet): SquareSet {
    if (kingAttacks(square).intersects(this.board.pieces(attacker, 'k-piece'))) {
      return SquareSet.empty();
    }
    return super.kingAttackers(square, attacker, occupied);
  }

  protected playCaptureAt(square: Square, captured: Piece): void {
    super.playCaptureAt(square, captured);
    this.board.take(square);
    for (const explode of kingAttacks(square).intersect(this.board.occupied).diff(this.board['p-piece'])) {
      const piece = this.board.take(explode);
      if (piece && piece.role === 'r-piece') this.castles.discardRook(explode);
      if (piece && piece.role === 'k-piece') this.castles.discardSide(piece.playerIndex);
    }
  }

  hasInsufficientMaterial(playerIndex: PlayerIndex): boolean {
    // Remaining material does not matter if the enemy king is already
    // exploded.
    if (this.board.pieces(opposite(playerIndex), 'k-piece').isEmpty()) return false;

    // Bare king cannot mate.
    if (this.board[playerIndex].diff(this.board['k-piece']).isEmpty()) return true;

    // As long as the enemy king is not alone, there is always a chance their
    // own pieces explode next to it.
    if (this.board[opposite(playerIndex)].diff(this.board['k-piece']).nonEmpty()) {
      // Unless there are only bishops that cannot explode each other.
      if (this.board.occupied.equals(this.board['b-piece'].union(this.board['k-piece']))) {
        if (!this.board['b-piece'].intersect(this.board.p1).intersects(SquareSet.darkSquares())) {
          return !this.board['b-piece'].intersect(this.board.p2).intersects(SquareSet.lightSquares());
        }
        if (!this.board['b-piece'].intersect(this.board.p1).intersects(SquareSet.lightSquares())) {
          return !this.board['b-piece'].intersect(this.board.p2).intersects(SquareSet.darkSquares());
        }
      }
      return false;
    }

    // Queen or pawn (future queen) can give mate against bare king.
    if (this.board['q-piece'].nonEmpty() || this.board['p-piece'].nonEmpty()) return false;

    // Single knight, bishop or rook cannot mate against bare king.
    if (this.board['n-piece'].union(this.board['b-piece']).union(this.board['r-piece']).isSingleSquare()) return true;

    // If only knights, more than two are required to mate bare king.
    if (this.board.occupied.equals(this.board['n-piece'].union(this.board['k-piece']))) {
      return this.board['n-piece'].size() <= 2;
    }

    return false;
  }

  dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();
    let dests = SquareSet.empty();
    for (const to of this.pseudoDests(square, ctx)) {
      const after = this.clone();
      after.play({ from: square, to });
      const ourKing = after.board.kingOf(this.turn);
      if (
        defined(ourKing) &&
        (!defined(after.board.kingOf(after.turn)) ||
          after.kingAttackers(ourKing, after.turn, after.board.occupied).isEmpty())
      ) {
        dests = dests.with(to);
      }
    }
    return dests;
  }

  isVariantEnd(): boolean {
    return !!this.variantOutcome();
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    for (const playerIndex of PLAYERINDEXES) {
      if (this.board.pieces(playerIndex, 'k-piece').isEmpty()) return { winner: opposite(playerIndex) };
    }
    return;
  }
}

export class Antichess extends Chess {
  protected constructor() {
    super('antichess');
  }

  static default(): Antichess {
    const pos = super.default();
    pos.castles = Castles.empty();
    return pos as Antichess;
  }

  static fromSetup(setup: Setup): Result<Antichess, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.castles = Castles.empty();
      return pos as Antichess;
    });
  }

  clone(): Antichess {
    return super.clone() as Antichess;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (SquareSet.backranks().intersects(this.board['p-piece']))
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    return Result.ok(undefined);
  }

  protected kingAttackers(_square: Square, _attacker: PlayerIndex, _occupied: SquareSet): SquareSet {
    return SquareSet.empty();
  }

  ctx(): Context {
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

  dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();
    const dests = this.pseudoDests(square, ctx);
    if (!ctx.mustCapture) return dests;
    return dests.intersect(this.board[opposite(this.turn)]);
  }

  hasInsufficientMaterial(playerIndex: PlayerIndex): boolean {
    if (this.board.occupied.equals(this.board['b-piece'])) {
      const weSomeOnLight = this.board[playerIndex].intersects(SquareSet.lightSquares());
      const weSomeOnDark = this.board[playerIndex].intersects(SquareSet.darkSquares());
      const theyAllOnDark = this.board[opposite(playerIndex)].isDisjoint(SquareSet.lightSquares());
      const theyAllOnLight = this.board[opposite(playerIndex)].isDisjoint(SquareSet.darkSquares());
      return (weSomeOnLight && theyAllOnDark) || (weSomeOnDark && theyAllOnLight);
    }
    return false;
  }

  isVariantEnd(): boolean {
    return this.board[this.turn].isEmpty();
  }

  variantOutcome(ctx?: Context): Outcome | undefined {
    ctx = ctx || this.ctx();
    if (ctx.variantEnd || this.isStalemate(ctx)) {
      return { winner: this.turn };
    }
    return;
  }
}

export class KingOfTheHill extends Chess {
  protected constructor() {
    super('kingofthehill');
  }

  static default(): KingOfTheHill {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<KingOfTheHill, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): KingOfTheHill {
    return super.clone() as KingOfTheHill;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }

  isVariantEnd(): boolean {
    return this.board['k-piece'].intersects(SquareSet.center());
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    for (const playerIndex of PLAYERINDEXES) {
      if (this.board.pieces(playerIndex, 'k-piece').intersects(SquareSet.center())) return { winner: playerIndex };
    }
    return;
  }
}

export class ThreeCheck extends Chess {
  protected constructor() {
    super('3check');
  }

  static default(): ThreeCheck {
    const pos = super.default();
    pos.remainingChecks = RemainingChecks.default();
    return pos;
  }

  static fromSetup(setup: Setup): Result<ThreeCheck, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.remainingChecks = setup.remainingChecks ? setup.remainingChecks.clone() : RemainingChecks.default();
      return pos;
    });
  }

  clone(): ThreeCheck {
    return super.clone() as ThreeCheck;
  }

  hasInsufficientMaterial(playerIndex: PlayerIndex): boolean {
    return this.board.pieces(playerIndex, 'k-piece').equals(this.board[playerIndex]);
  }

  isVariantEnd(): boolean {
    return !!this.remainingChecks && (this.remainingChecks.p1 <= 0 || this.remainingChecks.p2 <= 0);
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    if (this.remainingChecks) {
      for (const playerIndex of PLAYERINDEXES) {
        if (this.remainingChecks[playerIndex] <= 0) return { winner: playerIndex };
      }
    }
    return;
  }
}

export class FiveCheck extends Chess {
  protected constructor() {
    super('5check');
  }

  static default(): FiveCheck {
    const pos = super.default();
    pos.remainingChecks = RemainingChecks.fiveCheck();
    return pos;
  }

  static fromSetup(setup: Setup): Result<FiveCheck, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.remainingChecks = setup.remainingChecks ? setup.remainingChecks.clone() : RemainingChecks.fiveCheck();
      return pos;
    });
  }

  clone(): FiveCheck {
    return super.clone() as FiveCheck;
  }

  hasInsufficientMaterial(playerIndex: PlayerIndex): boolean {
    return this.board.pieces(playerIndex, 'k-piece').equals(this.board[playerIndex]);
  }

  isVariantEnd(): boolean {
    return !!this.remainingChecks && (this.remainingChecks.p1 <= 0 || this.remainingChecks.p2 <= 0);
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    if (this.remainingChecks) {
      for (const playerIndex of PLAYERINDEXES) {
        if (this.remainingChecks[playerIndex] <= 0) return { winner: playerIndex };
      }
    }
    return;
  }
}

class RacingKings extends Chess {
  protected constructor() {
    super('racingkings');
  }

  static default(): RacingKings {
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

  static fromSetup(setup: Setup): Result<RacingKings, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.castles = Castles.empty();
      return pos as RacingKings;
    });
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.isCheck()) return Result.err(new PositionError(IllegalSetup.ImpossibleCheck));
    if (this.board['p-piece'].nonEmpty()) return Result.err(new PositionError(IllegalSetup.Variant));
    return super.validate();
  }

  clone(): RacingKings {
    return super.clone() as RacingKings;
  }

  dests(square: Square, ctx?: Context): SquareSet {
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

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }

  isVariantEnd(): boolean {
    const goal = SquareSet.fromRank(7);
    const inGoal = this.board['k-piece'].intersect(goal);
    if (inGoal.isEmpty()) return false;
    if (this.turn === 'p1' || inGoal.intersects(this.board.p2)) return true;

    // P1 has reached the backrank. Check if p2 can catch up.
    const p2King = this.board.kingOf('p2');
    if (defined(p2King)) {
      const occ = this.board.occupied.without(p2King);
      for (const target of kingAttacks(p2King).intersect(goal).diff(this.board.p2)) {
        if (this.kingAttackers(target, 'p1', occ).isEmpty()) return false;
      }
    }
    return true;
  }

  variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;
    const goal = SquareSet.fromRank(7);
    const p2InGoal = this.board.pieces('p2', 'k-piece').intersects(goal);
    const p1InGoal = this.board.pieces('p1', 'k-piece').intersects(goal);
    if (p2InGoal && !p1InGoal) return { winner: 'p2' };
    if (p1InGoal && !p2InGoal) return { winner: 'p1' };
    return { winner: undefined };
  }
}

export class Horde extends Chess {
  protected constructor() {
    super('horde');
  }

  static default(): Horde {
    const pos = new this();
    pos.board = Board.horde();
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

  static fromSetup(setup: Setup): Result<Horde, PositionError> {
    return super.fromSetup(setup) as Result<Horde, PositionError>;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (!this.board['k-piece'].isSingleSquare()) return Result.err(new PositionError(IllegalSetup.Kings));
    if (!this.board['k-piece'].diff(this.board.promoted).isSingleSquare())
      return Result.err(new PositionError(IllegalSetup.Kings));

    const otherKing = this.board.kingOf(opposite(this.turn));
    if (defined(otherKing) && this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    for (const playerIndex of PLAYERINDEXES) {
      if (this.board.pieces(playerIndex, 'p-piece').intersects(SquareSet.backrank(opposite(playerIndex)))) {
        return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
      }
    }
    return this.validateCheckers();
  }

  clone(): Horde {
    return super.clone() as Horde;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    // TODO: Could detect cases where the horde cannot mate.
    return false;
  }

  isVariantEnd(): boolean {
    return this.board.p1.isEmpty() || this.board.p2.isEmpty();
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    if (this.board.p1.isEmpty()) return { winner: 'p2' };
    if (this.board.p2.isEmpty()) return { winner: 'p1' };
    return;
  }
}

export class NoCastling extends Chess {
  protected constructor() {
    super('nocastling');
  }

  static default(): NoCastling {
    const pos = super.default();
    pos.castles = Castles.empty();
    return pos as NoCastling;
  }

  static fromSetup(setup: Setup): Result<NoCastling, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.castles = Castles.empty();
      return pos as NoCastling;
    });
  }

  clone(): NoCastling {
    return super.clone() as NoCastling;
  }
}

export class LinesOfAction extends Chess {
  protected constructor() {
    super('linesofaction');
  }

  static default(): LinesOfAction {
    const pos = new this();
    pos.board = Board.linesOfAction();
    pos.pockets = undefined;
    pos.turn = 'p1';
    pos.castles = Castles.empty();
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static fromSetup(setup: Setup): Result<LinesOfAction, PositionError> {
    return super.fromSetup(setup) as Result<LinesOfAction, PositionError>;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    // TODO: maybe do some more validation of the position
    return Result.ok(undefined);
  }

  clone(): LinesOfAction {
    return super.clone() as LinesOfAction;
  }

  hasInsufficientMaterial(): boolean {
    return false;
  }

  isVariantEnd(): boolean {
    return !!this.variantOutcome();
  }

  isPlayerIndexConnected(playerIndex: PlayerIndex): boolean {
    const pieces = playerIndex === 'p1' ? this.board.p1 : this.board.p2;
    let connected = SquareSet.empty();

    let next = pieces.first();
    while (next) {
      connected = connected.with(next);
      next = kingAttacks(next).intersect(pieces).diff(connected).first();
    }
    return connected.size() > 0 && connected.size() === pieces.size();
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    const p1Wins = this.isPlayerIndexConnected('p1');
    const p2Wins = this.isPlayerIndexConnected('p2');
    if (p1Wins && !p2Wins) {
      return { winner: 'p1' };
    } else if (!p1Wins && p2Wins) {
      return { winner: 'p2' };
    } else {
      return undefined;
    }
  }
}

export class ScrambledEggs extends Chess {
  protected constructor() {
    super('scrambledeggs');
  }

  static default(): ScrambledEggs {
    const pos = new this();
    pos.board = Board.linesOfAction();
    pos.pockets = undefined;
    pos.turn = 'p1';
    pos.castles = Castles.empty();
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static fromSetup(setup: Setup): Result<ScrambledEggs, PositionError> {
    return super.fromSetup(setup) as Result<ScrambledEggs, PositionError>;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    // TODO: maybe do some more validation of the position
    return Result.ok(undefined);
  }

  clone(): ScrambledEggs {
    return super.clone() as ScrambledEggs;
  }

  hasInsufficientMaterial(): boolean {
    return false;
  }

  isVariantEnd(): boolean {
    return !!this.variantOutcome();
  }

  isPlayerIndexConnected(playerIndex: PlayerIndex): boolean {
    const pieces = playerIndex === 'p1' ? this.board.p1 : this.board.p2;
    let connected = SquareSet.empty();

    let next = pieces.first();
    while (next) {
      connected = connected.with(next);
      next = kingAttacks(next).intersect(pieces).diff(connected).first();
    }
    return connected.size() > 0 && connected.size() === pieces.size();
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    const p1Wins = this.isPlayerIndexConnected('p1');
    const p2Wins = this.isPlayerIndexConnected('p2');
    if (p1Wins && !p2Wins) {
      return { winner: 'p1' };
    } else if (!p1Wins && p2Wins) {
      return { winner: 'p2' };
    } else {
      return undefined;
    }
  }
}

export class Shogi extends Chess {
  //TODO - move into own class and have variant family
  protected constructor() {
    super('shogi');
  }

  static default(): Shogi {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Shogi, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Shogi {
    return super.clone() as Shogi;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class MiniShogi extends Chess {
  protected constructor() {
    super('minishogi');
  }

  static default(): MiniShogi {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<MiniShogi, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): MiniShogi {
    return super.clone() as MiniShogi;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class Xiangqi extends Chess {
  //TODO - move into own class and have variant family
  protected constructor() {
    super('xiangqi');
  }

  static default(): Xiangqi {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Xiangqi, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Xiangqi {
    return super.clone() as Xiangqi;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class MiniXiangqi extends Chess {
  protected constructor() {
    super('minixiangqi');
  }

  static default(): MiniXiangqi {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<MiniXiangqi, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): MiniXiangqi {
    return super.clone() as MiniXiangqi;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export function defaultPosition(rules: Rules): Position {
  switch (rules) {
    case 'chess':
      return Chess.default();
    case 'antichess':
      return Antichess.default();
    case 'atomic':
      return Atomic.default();
    case 'horde':
      return Horde.default();
    case 'racingkings':
      return RacingKings.default();
    case 'kingofthehill':
      return KingOfTheHill.default();
    case '3check':
      return ThreeCheck.default();
    case '5check':
      return FiveCheck.default();
    case 'crazyhouse':
      return Crazyhouse.default();
    case 'nocastling':
      return NoCastling.default();
    case 'linesofaction':
      return LinesOfAction.default();
    case 'scrambledeggs':
      return ScrambledEggs.default();
    case 'shogi':
      return Shogi.default();
    case 'minishogi':
      return MiniShogi.default();
    case 'xiangqi':
      return Xiangqi.default();
    case 'minixiangqi':
      return MiniXiangqi.default();
  }
}

export function setupPosition(rules: Rules, setup: Setup): Result<Position, PositionError> {
  switch (rules) {
    case 'chess':
      return Chess.fromSetup(setup);
    case 'antichess':
      return Antichess.fromSetup(setup);
    case 'atomic':
      return Atomic.fromSetup(setup);
    case 'horde':
      return Horde.fromSetup(setup);
    case 'racingkings':
      return RacingKings.fromSetup(setup);
    case 'kingofthehill':
      return KingOfTheHill.fromSetup(setup);
    case '3check':
      return ThreeCheck.fromSetup(setup);
    case '5check':
      return FiveCheck.fromSetup(setup);
    case 'crazyhouse':
      return Crazyhouse.fromSetup(setup);
    case 'nocastling':
      return NoCastling.fromSetup(setup);
    case 'linesofaction':
      return LinesOfAction.fromSetup(setup);
    case 'scrambledeggs':
      return ScrambledEggs.fromSetup(setup);
    case 'shogi':
      return Shogi.fromSetup(setup);
    case 'minishogi':
      return MiniShogi.fromSetup(setup);
    case 'xiangqi':
      return Xiangqi.fromSetup(setup);
    case 'minixiangqi':
      return MiniXiangqi.fromSetup(setup);
  }
}
