import { Result } from '@badrap/result';

import { between, kingAttacks } from './attacks.js';
import { Board } from './board.js';
import { Castles, Chess, Context, IllegalSetup, Position, PositionError } from './chess.js';
import { Material, RemainingChecks, Setup } from './setup.js';
import { SquareSet } from './squareSet.js';
import { Outcome, Piece, PlayerIndex, PLAYERINDEXES, Rules, Square } from './types.js';
import { defined, opposite } from './util.js';

import { Abalone } from './variants/abalone/abalone.js';
import { MiniXiangqi, Xiangqi } from './variants/xiangqi';

export { Castles, Chess, Context, IllegalSetup, Position, PositionError };

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
      this.board.occupied.size() + this.pockets.count() <= 3
      && this.board['p-piece'].isEmpty()
      && this.board.promoted.isEmpty()
      && this.board.rooksAndQueens().isEmpty()
      && this.pockets.p1['p-piece'] <= 0
      && this.pockets.p2['p-piece'] <= 0
      && this.pockets.p1['r-piece'] <= 0
      && this.pockets.p2['r-piece'] <= 0
      && this.pockets.p1['q-piece'] <= 0
      && this.pockets.p2['q-piece'] <= 0
    );
  }

  dropDests(ctx?: Context): SquareSet {
    const mask = this.board.occupied
      .complement()
      .intersect(
        this.pockets?.[this.turn].hasNonPawns()
          ? SquareSet.full64()
          : this.pockets?.[this.turn].hasPawns()
          ? SquareSet.backranks64().complement()
          : SquareSet.empty(),
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
    if (SquareSet.backranks64().intersects(this.board['p-piece'])) {
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
    for (const explode of kingAttacks(square).intersect(this.board.occupied).diff64(this.board['p-piece'])) {
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
    if (this.board[playerIndex].diff64(this.board['k-piece']).isEmpty()) return true;

    // As long as the enemy king is not alone, there is always a chance their
    // own pieces explode next to it.
    if (this.board[opposite(playerIndex)].diff64(this.board['k-piece']).nonEmpty()) {
      // Unless there are only bishops that cannot explode each other.
      if (this.board.occupied.equals(this.board['b-piece'].union(this.board['k-piece']))) {
        if (!this.board['b-piece'].intersect(this.board.p1).intersects(SquareSet.darkSquares64())) {
          return !this.board['b-piece'].intersect(this.board.p2).intersects(SquareSet.lightSquares64());
        }
        if (!this.board['b-piece'].intersect(this.board.p1).intersects(SquareSet.lightSquares64())) {
          return !this.board['b-piece'].intersect(this.board.p2).intersects(SquareSet.darkSquares64());
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
        defined(ourKing)
        && (!defined(after.board.kingOf(after.turn))
          || after.kingAttackers(ourKing, after.turn, after.board.occupied).isEmpty())
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
    if (SquareSet.backranks64().intersects(this.board['p-piece'])) {
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    }
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
      const weSomeOnLight = this.board[playerIndex].intersects(SquareSet.lightSquares64());
      const weSomeOnDark = this.board[playerIndex].intersects(SquareSet.darkSquares64());
      const theyAllOnDark = this.board[opposite(playerIndex)].isDisjoint(SquareSet.lightSquares64());
      const theyAllOnLight = this.board[opposite(playerIndex)].isDisjoint(SquareSet.darkSquares64());
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
    return this.board['k-piece'].intersects(SquareSet.center64());
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    for (const playerIndex of PLAYERINDEXES) {
      if (this.board.pieces(playerIndex, 'k-piece').intersects(SquareSet.center64())) return { winner: playerIndex };
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

  variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;
    const goal = SquareSet.fromRank64(7);
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
    if (!this.board['k-piece'].diff64(this.board.promoted).isSingleSquare()) {
      return Result.err(new PositionError(IllegalSetup.Kings));
    }

    const otherKing = this.board.kingOf(opposite(this.turn));
    if (defined(otherKing) && this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    }
    for (const playerIndex of PLAYERINDEXES) {
      if (this.board.pieces(playerIndex, 'p-piece').intersects(SquareSet.backrank64(opposite(playerIndex)))) {
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

export class Monster extends Chess {
  protected constructor() {
    super('monster');
  }

  static default(): Monster {
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

  static fromSetup(setup: Setup): Result<Monster, PositionError> {
    return super.fromSetup(setup) as Result<Monster, PositionError>;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    // TODO: maybe do some more validation of the position
    return Result.ok(undefined);
  }

  clone(): Monster {
    return super.clone() as Monster;
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
      next = kingAttacks(next).intersect(pieces).diff64(connected).first();
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
      next = kingAttacks(next).intersect(pieces).diff64(connected).first();
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
  // TODO - move into own class and have variant family
  protected constructor() {
    super('shogi');
  }

  static default(): Shogi {
    const pos = new this();
    pos.board = Board.shogi();
    return pos;
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

export class Flipello extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('flipello');
  }

  static default(): Flipello {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Flipello, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Flipello {
    return super.clone() as Flipello;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class Flipello10 extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('flipello10');
  }

  static default(): Flipello10 {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Flipello10, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Flipello10 {
    return super.clone() as Flipello10;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class Amazons extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('amazons');
  }

  static default(): Amazons {
    const pos = super.default();
    return pos as Amazons;
  }

  static fromSetup(setup: Setup): Result<Amazons, PositionError> {
    return super.fromSetup(setup).map(v => {
      if (defined(setup.lastMove)) v.play(setup.lastMove);
      return v as Amazons;
    });
  }
  // TODO: override toSetup to include half move.

  clone(): Amazons {
    return super.clone() as Amazons;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));

    return Result.ok(undefined);
  }
}

export class Breakthrough extends Chess {
  protected constructor() {
    super('breakthrough');
  }

  static default(): Breakthrough {
    return super.default() as Breakthrough;
  }

  static fromSetup(setup: Setup): Result<Breakthrough, PositionError> {
    return super.fromSetup(setup) as Result<Breakthrough, PositionError>;
  }

  clone(): Breakthrough {
    return super.clone() as Breakthrough;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    return Result.ok(undefined);
  }

  /*
   * seems like outcome and the other related f() below are related to src/san makeSanAndPlay()
   * makeSanAndPlay() is actually not called from within strategygames
   */
  outcome(ctx?: Context): Outcome | undefined {
    const variantOutcome = this.variantOutcome(ctx);
    if (variantOutcome) return variantOutcome;
    ctx = ctx || this.ctx();
    if (this.isInsufficientMaterial()) return { winner: opposite(this.turn) };
    else return;
  }

  isInsufficientMaterial(): boolean {
    return this.hasInsufficientMaterial(this.turn);
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    if (this.board[_playerIndex].intersect(this.board['p-piece']).isEmpty()) return true;
    return false;
  }

  isVariantEnd(): boolean {
    const goalP1 = SquareSet.fromRank64(7);
    const goalP2 = SquareSet.fromRank64(0);
    const p2InGoal = this.board.pieces('p2', 'p-piece').intersects(goalP2);
    const p1InGoal = this.board.pieces('p1', 'p-piece').intersects(goalP1);
    if (p2InGoal || p1InGoal) {
      return true;
    }
    return false;
  }

  variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;
    const goalP1 = SquareSet.fromRank64(7);
    const goalP2 = SquareSet.fromRank64(0);
    const p2InGoal = this.board.pieces('p2', 'p-piece').intersects(goalP2);
    const p1InGoal = this.board.pieces('p1', 'p-piece').intersects(goalP1);
    if (p2InGoal && !p1InGoal) return { winner: 'p2' };
    if (p1InGoal && !p2InGoal) return { winner: 'p1' };
    return { winner: undefined };
  }
}

export class MiniBreakthrough extends Chess {
  protected constructor() {
    super('minibreakthrough');
  }

  static default(): MiniBreakthrough {
    return super.default() as MiniBreakthrough;
  }

  static fromSetup(setup: Setup): Result<MiniBreakthrough, PositionError> {
    return super.fromSetup(setup) as Result<MiniBreakthrough, PositionError>;
  }

  clone(): MiniBreakthrough {
    return super.clone() as MiniBreakthrough;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    return Result.ok(undefined);
  }
}

export class Oware extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('oware');
  }

  static default(): Oware {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Oware, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Oware {
    return super.clone() as Oware;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class Togyzkumalak extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('togyzkumalak');
  }

  static default(): Togyzkumalak {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Togyzkumalak, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Togyzkumalak {
    return super.clone() as Togyzkumalak;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class Bestemshe extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('bestemshe');
  }

  static default(): Bestemshe {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Bestemshe, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Bestemshe {
    return super.clone() as Bestemshe;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class Go9x9 extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('go9x9');
  }

  static default(): Go9x9 {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Go9x9, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Go9x9 {
    return super.clone() as Go9x9;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class Go13x13 extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('go13x13');
  }

  static default(): Go13x13 {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Go13x13, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Go13x13 {
    return super.clone() as Go13x13;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class Go19x19 extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('go19x19');
  }

  static default(): Go19x19 {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Go19x19, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Go19x19 {
    return super.clone() as Go19x19;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class Backgammon extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('backgammon');
  }

  static default(): Backgammon {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Backgammon, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Backgammon {
    return super.clone() as Backgammon;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class Hyper extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('hyper');
  }

  static default(): Hyper {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Hyper, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Hyper {
    return super.clone() as Hyper;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}

export class Nackgammon extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('nackgammon');
  }

  static default(): Nackgammon {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Nackgammon, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Nackgammon {
    return super.clone() as Nackgammon;
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
    case 'monster':
      return Monster.default();
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
    case 'flipello':
      return Flipello.default();
    case 'flipello10':
      return Flipello10.default();
    case 'amazons':
      return Amazons.default();
    case 'oware':
      return Oware.default();
    case 'togyzkumalak':
      return Togyzkumalak.default();
    case 'bestemshe':
      return Bestemshe.default();
    case 'go9x9':
      return Go9x9.default();
    case 'go13x13':
      return Go13x13.default();
    case 'go19x19':
      return Go19x19.default();
    case 'backgammon':
      return Backgammon.default();
    case 'hyper':
      return Hyper.default();
    case 'nackgammon':
      return Nackgammon.default();
    case 'breakthrough':
      return Breakthrough.default();
    case 'minibreakthrough':
      return MiniBreakthrough.default();
    case 'abalone':
      return Abalone.default();
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
    case 'monster':
      return Monster.fromSetup(setup);
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
    case 'flipello':
      return Flipello.fromSetup(setup);
    case 'flipello10':
      return Flipello10.fromSetup(setup);
    case 'amazons':
      return Amazons.fromSetup(setup);
    case 'oware':
      return Oware.fromSetup(setup);
    case 'togyzkumalak':
      return Togyzkumalak.fromSetup(setup);
    case 'bestemshe':
      return Bestemshe.fromSetup(setup);
    case 'go9x9':
      return Go9x9.fromSetup(setup);
    case 'go13x13':
      return Go13x13.fromSetup(setup);
    case 'go19x19':
      return Go19x19.fromSetup(setup);
    case 'backgammon':
      return Backgammon.fromSetup(setup);
    case 'hyper':
      return Hyper.fromSetup(setup);
    case 'nackgammon':
      return Nackgammon.fromSetup(setup);
    case 'breakthrough':
      return Breakthrough.fromSetup(setup);
    case 'minibreakthrough':
      return MiniBreakthrough.fromSetup(setup);
    case 'abalone':
      return Abalone.fromSetup(setup);
  }
}
