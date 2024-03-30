import { Result } from '@badrap/result';
import {
  Rules,
  CastlingSide,
  CASTLING_SIDES,
  PlayerIndex,
  PLAYERINDEXES,
  Square,
  ByPlayerIndex,
  ByCastlingSide,
  Move,
  NormalMove,
  isDrop,
  Piece,
  Outcome,
} from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup, Material, RemainingChecks } from './setup';
import {
  attacks,
  bishopAttacks,
  rookAttacks,
  queenAttacks,
  knightAttacks,
  kingAttacks,
  pawnAttacks,
  between,
  ray,
} from './attacks';
import { kingCastlesTo, opposite, defined, squareRank } from './util';
import * as fp from './fp';

export enum IllegalSetup {
  Empty = 'ERR_EMPTY',
  OppositeCheck = 'ERR_OPPOSITE_CHECK',
  ImpossibleCheck = 'ERR_IMPOSSIBLE_CHECK',
  PawnsOnBackrank = 'ERR_PAWNS_ON_BACKRANK',
  Kings = 'ERR_KINGS',
  Variant = 'ERR_VARIANT',
}

export class PositionError extends Error {}

function attacksTo(square: Square, attacker: PlayerIndex, board: Board, occupied: SquareSet): SquareSet {
  return board[attacker].intersect(
    rookAttacks(square, occupied)
      .intersect(board.rooksAndQueens())
      .union(bishopAttacks(square, occupied).intersect(board.bishopsAndQueens()))
      .union(knightAttacks(square).intersect(board['n-piece']))
      .union(kingAttacks(square).intersect(board['k-piece']))
      .union(pawnAttacks(opposite(attacker), square).intersect(board['p-piece'])),
  );
}

function rookCastlesTo(playerIndex: PlayerIndex, side: CastlingSide): Square {
  return playerIndex === 'p1' ? (side === 'a' ? 3 : 5) : side === 'a' ? 59 : 61;
}

export class Castles {
  unmovedRooks: SquareSet;
  rook: ByPlayerIndex<ByCastlingSide<Square | undefined>>;
  path: ByPlayerIndex<ByCastlingSide<SquareSet>>;

  private constructor() {}

  static default(): Castles {
    const castles = new Castles();
    castles.unmovedRooks = SquareSet.corners64();
    castles.rook = {
      p1: { a: 0, h: 7 },
      p2: { a: 56, h: 63 },
    };
    castles.path = {
      p1: { a: new SquareSet([0xe, 0, 0, 0]), h: new SquareSet([0x60, 0, 0, 0]) },
      p2: { a: new SquareSet([0, 0x0e000000, 0, 0]), h: new SquareSet([0, 0x60000000, 0, 0]) },
    };
    return castles;
  }

  static empty(): Castles {
    const castles = new Castles();
    castles.unmovedRooks = SquareSet.empty();
    castles.rook = {
      p1: { a: undefined, h: undefined },
      p2: { a: undefined, h: undefined },
    };
    castles.path = {
      p1: { a: SquareSet.empty(), h: SquareSet.empty() },
      p2: { a: SquareSet.empty(), h: SquareSet.empty() },
    };
    return castles;
  }

  clone(): Castles {
    const castles = new Castles();
    castles.unmovedRooks = this.unmovedRooks;
    castles.rook = {
      p1: { a: this.rook.p1.a, h: this.rook.p1.h },
      p2: { a: this.rook.p2.a, h: this.rook.p2.h },
    };
    castles.path = {
      p1: { a: this.path.p1.a, h: this.path.p1.h },
      p2: { a: this.path.p2.a, h: this.path.p2.h },
    };
    return castles;
  }

  private add(playerIndex: PlayerIndex, side: CastlingSide, king: Square, rook: Square): void {
    const kingTo = kingCastlesTo(playerIndex, side);
    const rookTo = rookCastlesTo(playerIndex, side);
    this.unmovedRooks = this.unmovedRooks.with(rook);
    this.rook[playerIndex][side] = rook;
    this.path[playerIndex][side] = between(rook, rookTo)
      .with(rookTo)
      .union(between(king, kingTo).with(kingTo))
      .without(king)
      .without(rook);
  }

  static fromSetup(setup: Setup): Castles {
    const castles = Castles.empty();
    const rooks = setup.unmovedRooks.intersect(setup.board['r-piece']);
    for (const playerIndex of PLAYERINDEXES) {
      const backrank = SquareSet.backrank64(playerIndex);
      const king = setup.board.kingOf(playerIndex);
      if (!defined(king) || !backrank.has(king)) continue;
      const side = rooks.intersect(setup.board[playerIndex]).intersect(backrank);
      const aSide = side.first();
      if (defined(aSide) && aSide < king) castles.add(playerIndex, 'a', king, aSide);
      const hSide = side.last();
      if (defined(hSide) && king < hSide) castles.add(playerIndex, 'h', king, hSide);
    }
    return castles;
  }

  discardRook(square: Square): void {
    if (this.unmovedRooks.has(square)) {
      this.unmovedRooks = this.unmovedRooks.without(square);
      for (const playerIndex of PLAYERINDEXES) {
        for (const side of CASTLING_SIDES) {
          if (this.rook[playerIndex][side] === square) this.rook[playerIndex][side] = undefined;
        }
      }
    }
  }

  discardSide(playerIndex: PlayerIndex): void {
    this.unmovedRooks = this.unmovedRooks.diff64(SquareSet.backrank64(playerIndex));
    this.rook[playerIndex].a = undefined;
    this.rook[playerIndex].h = undefined;
  }
}

export interface Context {
  king: Square | undefined;
  blockers: SquareSet;
  checkers: SquareSet;
  variantEnd: boolean;
  mustCapture: boolean;
}

export abstract class Position {
  board: Board;
  pockets: Material | undefined;
  turn: PlayerIndex;
  castles: Castles;
  epSquare: Square | undefined;
  remainingChecks: RemainingChecks | undefined;
  halfmoves: number;
  fullmoves: number;

  protected constructor(readonly rules: Rules) {}

  // When subclassing:
  // - static default()
  // - static fromSetup()
  // - Proper signature for clone()

  abstract dests(square: Square, ctx?: Context): SquareSet;
  abstract isVariantEnd(): boolean;
  abstract variantOutcome(ctx?: Context): Outcome | undefined;
  abstract hasInsufficientMaterial(playerIndex: PlayerIndex): boolean;

  protected kingAttackers(square: Square, attacker: PlayerIndex, occupied: SquareSet): SquareSet {
    return attacksTo(square, attacker, this.board, occupied);
  }

  dropDests(_ctx?: Context): SquareSet {
    return SquareSet.empty();
  }

  protected playCaptureAt(square: Square, captured: Piece): void {
    this.halfmoves = 0;
    if (captured.role === 'r-piece') this.castles.discardRook(square);
    if (this.pockets) this.pockets[opposite(captured.playerIndex)][captured.role]++;
  }

  ctx(): Context {
    const variantEnd = this.isVariantEnd();
    const king = this.board.kingOf(this.turn);
    if (!defined(king))
      return { king, blockers: SquareSet.empty(), checkers: SquareSet.empty(), variantEnd, mustCapture: false };
    const snipers = rookAttacks(king, SquareSet.empty())
      .intersect(this.board.rooksAndQueens())
      .union(bishopAttacks(king, SquareSet.empty()).intersect(this.board.bishopsAndQueens()))
      .intersect(this.board[opposite(this.turn)]);
    let blockers = SquareSet.empty();
    for (const sniper of snipers) {
      const b = between(king, sniper).intersect(this.board.occupied);
      if (!b.moreThanOne()) blockers = blockers.union(b);
    }
    const checkers = this.kingAttackers(king, opposite(this.turn), this.board.occupied);
    return {
      king,
      blockers,
      checkers,
      variantEnd,
      mustCapture: false,
    };
  }

  // The following should be identical in all subclasses

  clone(): Position {
    const pos = new (this as any).constructor();
    pos.board = this.board.clone();
    pos.pockets = this.pockets?.clone();
    pos.turn = this.turn;
    pos.castles = this.castles.clone();
    pos.epSquare = this.epSquare;
    pos.remainingChecks = this.remainingChecks?.clone();
    pos.halfmoves = this.halfmoves;
    pos.fullmoves = this.fullmoves;
    return pos;
  }

  equalsIgnoreMoves(other: Position): boolean {
    return (
      this.rules === other.rules &&
      (this.pockets ? this.board.equals(other.board) : this.board.equalsIgnorePromoted(other.board)) &&
      ((other.pockets && this.pockets?.equals(other.pockets)) || (!this.pockets && !other.pockets)) &&
      this.turn === other.turn &&
      this.castles.unmovedRooks.equals(other.castles.unmovedRooks) &&
      this.legalEpSquare() === other.legalEpSquare() &&
      ((other.remainingChecks && this.remainingChecks?.equals(other.remainingChecks)) ||
        (!this.remainingChecks && !other.remainingChecks))
    );
  }

  toSetup(): Setup {
    return {
      board: this.board.clone(),
      pockets: this.pockets?.clone(),
      turn: this.turn,
      unmovedRooks: this.castles.unmovedRooks,
      epSquare: this.legalEpSquare(),
      remainingChecks: this.remainingChecks?.clone(),
      halfmoves: Math.min(this.halfmoves, 150),
      fullmoves: Math.min(Math.max(this.fullmoves, 1), 9999),
    };
  }

  isInsufficientMaterial(): boolean {
    return PLAYERINDEXES.every(playerIndex => this.hasInsufficientMaterial(playerIndex));
  }

  hasDests(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    for (const square of this.board[this.turn]) {
      if (this.dests(square, ctx).nonEmpty()) return true;
    }
    return this.dropDests(ctx).nonEmpty();
  }

  isLegal(move: Move, ctx?: Context): boolean {
    if (isDrop(move)) {
      if (!this.pockets || this.pockets[this.turn][move.role] <= 0) return false;
      if (move.role === 'p-piece' && SquareSet.backranks64().has(move.to)) return false;
      return this.dropDests(ctx).has(move.to);
    } else {
      if (move.promotion === 'p-piece') return false;
      if (move.promotion === 'k-piece' && this.rules !== 'antichess') return false;
      if (!!move.promotion !== (this.board['p-piece'].has(move.from) && SquareSet.backranks64().has(move.to)))
        return false;
      const dests = this.dests(move.from, ctx);
      return dests.has(move.to) || dests.has(this.normalizeMove(move).to);
    }
  }

  isCheck(): boolean {
    const king = this.board.kingOf(this.turn);
    return defined(king) && this.kingAttackers(king, opposite(this.turn), this.board.occupied).nonEmpty();
  }

  isEnd(ctx?: Context): boolean {
    if (ctx ? ctx.variantEnd : this.isVariantEnd()) return true;
    return this.isInsufficientMaterial() || !this.hasDests(ctx);
  }

  isCheckmate(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    return !ctx.variantEnd && ctx.checkers.nonEmpty() && !this.hasDests(ctx);
  }

  isStalemate(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    return !ctx.variantEnd && ctx.checkers.isEmpty() && !this.hasDests(ctx);
  }

  outcome(ctx?: Context): Outcome | undefined {
    const variantOutcome = this.variantOutcome(ctx);
    if (variantOutcome) return variantOutcome;
    ctx = ctx || this.ctx();
    if (this.isCheckmate(ctx)) return { winner: opposite(this.turn) };
    else if (this.isInsufficientMaterial() || this.isStalemate(ctx)) return { winner: undefined };
    else return;
  }

  allDests(ctx?: Context): Map<Square, SquareSet> {
    ctx = ctx || this.ctx();
    const d = new Map();
    if (ctx.variantEnd) return d;
    for (const square of this.board[this.turn]) {
      d.set(square, this.dests(square, ctx));
    }
    return d;
  }

  castlingSide(move: Move): CastlingSide | undefined {
    if (isDrop(move)) return;
    const delta = move.to - move.from;
    if (Math.abs(delta) !== 2 && !this.board[this.turn].has(move.to)) return;
    if (!this.board['k-piece'].has(move.from)) return;
    return delta > 0 ? 'h' : 'a';
  }

  normalizeMove(move: Move): Move {
    const castlingSide = this.castlingSide(move);
    if (!castlingSide) return move;
    const rookFrom = this.castles.rook[this.turn][castlingSide];
    return {
      from: (move as NormalMove).from,
      to: defined(rookFrom) ? rookFrom : move.to,
    };
  }

  play(move: Move): void {
    const turn = this.turn;
    const epSquare = this.epSquare;
    const castlingSide = this.castlingSide(move);

    this.epSquare = undefined;
    this.halfmoves += 1;
    if (turn === 'p2') this.fullmoves += 1;
    this.turn = opposite(turn);

    if (isDrop(move)) {
      this.board.set(move.to, { role: move.role, playerIndex: turn });
      if (this.pockets) this.pockets[turn][move.role]--;
      if (move.role === 'p-piece') this.halfmoves = 0;
    } else {
      const piece = this.board.take(move.from);
      if (!piece) return;

      let epCapture: Piece | undefined;
      if (piece.role === 'p-piece') {
        this.halfmoves = 0;
        if (move.to === epSquare) {
          epCapture = this.board.take(move.to + (turn === 'p1' ? -8 : 8));
        }
        const delta = move.from - move.to;
        if (Math.abs(delta) === 16 && 8 <= move.from && move.from <= 55) {
          this.epSquare = (move.from + move.to) >> 1;
        }
        if (move.promotion) {
          piece.role = move.promotion;
          piece.promoted = true;
        }
      } else if (piece.role === 'r-piece') {
        this.castles.discardRook(move.from);
      } else if (piece.role === 'k-piece') {
        if (castlingSide) {
          const rookFrom = this.castles.rook[turn][castlingSide];
          if (defined(rookFrom)) {
            const rook = this.board.take(rookFrom);
            this.board.set(kingCastlesTo(turn, castlingSide), piece);
            if (rook) this.board.set(rookCastlesTo(turn, castlingSide), rook);
          }
        }
        this.castles.discardSide(turn);
        if (castlingSide) return;
      }

      const capture = this.board.set(move.to, piece) || epCapture;
      if (capture) this.playCaptureAt(move.to, capture);
    }
  }

  private legalEpSquare(ctx?: Context): Square | undefined {
    if (!defined(this.epSquare)) return;
    ctx = ctx || this.ctx();
    const ourPawns = this.board.pieces(this.turn, 'p-piece');
    const candidates = ourPawns.intersect(pawnAttacks(opposite(this.turn), this.epSquare));
    for (const candidate of candidates) {
      if (this.dests(candidate, ctx).has(this.epSquare)) return this.epSquare;
    }
    return;
  }
}

export class Chess extends Position {
  protected constructor(rules?: Rules) {
    super(rules || 'chess');
  }

  static default(): Chess {
    const pos = new this();
    pos.board = Board.default();
    pos.pockets = undefined;
    pos.turn = 'p1';
    pos.castles = Castles.default();
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static fromSetup(setup: Setup): Result<Chess, PositionError> {
    const pos = new this();
    pos.board = setup.board.clone();
    pos.pockets = undefined;
    pos.turn = setup.turn;
    pos.castles = Castles.fromSetup(setup);
    pos.epSquare = pos.validEpSquare(setup.epSquare);
    pos.remainingChecks = undefined;
    pos.halfmoves = setup.halfmoves;
    pos.fullmoves = setup.fullmoves;
    return pos.validate().map(_ => pos);
  }

  clone(): Chess {
    return super.clone() as Chess;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (this.board['k-piece'].size() !== 2) return Result.err(new PositionError(IllegalSetup.Kings));

    if (!defined(this.board.kingOf(this.turn))) return Result.err(new PositionError(IllegalSetup.Kings));

    const otherKing = this.board.kingOf(opposite(this.turn));
    if (!defined(otherKing)) return Result.err(new PositionError(IllegalSetup.Kings));
    if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));

    if (SquareSet.backranks64().intersects(this.board['p-piece']))
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));

    return this.validateCheckers();
  }

  protected validateCheckers(): Result<undefined, PositionError> {
    const ourKing = this.board.kingOf(this.turn);
    if (defined(ourKing)) {
      // Multiple sliding checkers aligned with king.
      const checkers = this.kingAttackers(ourKing, opposite(this.turn), this.board.occupied);
      if (checkers.size() > 2 || (checkers.size() === 2 && ray(checkers.first()!, checkers.last()!).has(ourKing)))
        return Result.err(new PositionError(IllegalSetup.ImpossibleCheck));

      // En passant square aligned with checker and king.
      if (defined(this.epSquare)) {
        for (const checker of checkers) {
          if (ray(checker, this.epSquare).has(ourKing))
            return Result.err(new PositionError(IllegalSetup.ImpossibleCheck));
        }
      }
    }
    return Result.ok(undefined);
  }

  private validEpSquare(square: fp.Option<Square>): Square | undefined {
    if (!defined(square)) return;
    const epRank = this.turn === 'p1' ? 5 : 2;
    const forward = this.turn === 'p1' ? 8 : -8;
    if (squareRank('chess')(square) !== epRank) return;
    if (this.board.occupied.has(square + forward)) return;
    const pawn = square - forward;
    if (!this.board['p-piece'].has(pawn) || !this.board[opposite(this.turn)].has(pawn)) return;
    return square;
  }

  private castlingDest(side: CastlingSide, ctx: Context): SquareSet {
    if (!defined(ctx.king) || ctx.checkers.nonEmpty()) return SquareSet.empty();
    const rook = this.castles.rook[this.turn][side];
    if (!defined(rook)) return SquareSet.empty();
    if (this.castles.path[this.turn][side].intersects(this.board.occupied)) return SquareSet.empty();

    const kingTo = kingCastlesTo(this.turn, side);
    const kingPath = between(ctx.king, kingTo);
    const occ = this.board.occupied.without(ctx.king);
    for (const sq of kingPath) {
      if (this.kingAttackers(sq, opposite(this.turn), occ).nonEmpty()) return SquareSet.empty();
    }

    const rookTo = rookCastlesTo(this.turn, side);
    const after = this.board.occupied.toggle(ctx.king).toggle(rook).toggle(rookTo);
    if (this.kingAttackers(kingTo, opposite(this.turn), after).nonEmpty()) return SquareSet.empty();

    return SquareSet.fromSquare(rook);
  }

  private canCaptureEp(pawn: Square, ctx: Context): boolean {
    if (!defined(this.epSquare)) return false;
    if (!pawnAttacks(this.turn, pawn).has(this.epSquare)) return false;
    if (!defined(ctx.king)) return true;
    const captured = this.epSquare + (this.turn === 'p1' ? -8 : 8);
    const occupied = this.board.occupied.toggle(pawn).toggle(this.epSquare).toggle(captured);
    return !this.kingAttackers(ctx.king, opposite(this.turn), occupied).intersects(occupied);
  }

  protected pseudoDests(square: Square, ctx: Context): SquareSet {
    if (ctx.variantEnd) return SquareSet.empty();
    const piece = this.board.get(square);
    if (!piece || piece.playerIndex !== this.turn) return SquareSet.empty();

    let pseudo = attacks(piece, square, this.board.occupied, this.board.p1, this.board.p2);
    if (piece.role === 'p-piece') {
      let captureTargets = this.board[opposite(this.turn)];
      if (defined(this.epSquare)) captureTargets = captureTargets.with(this.epSquare);
      pseudo = pseudo.intersect(captureTargets);
      const delta = this.turn === 'p1' ? 8 : -8;
      const step = square + delta;
      if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
        pseudo = pseudo.with(step);
        const canDoubleStep = this.turn === 'p1' ? square < 16 : square >= 64 - 16;
        const doubleStep = step + delta;
        if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
          pseudo = pseudo.with(doubleStep);
        }
      }
      return pseudo;
    } else {
      pseudo = pseudo.diff64(this.board[this.turn]);
    }
    if (square === ctx.king) return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
    else return pseudo;
  }

  dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();
    if (ctx.variantEnd) return SquareSet.empty();
    const piece = this.board.get(square);
    if (!piece || piece.playerIndex !== this.turn) return SquareSet.empty();

    let pseudo, legal;
    if (piece.role === 'p-piece') {
      pseudo = pawnAttacks(this.turn, square).intersect(this.board[opposite(this.turn)]);
      const delta = this.turn === 'p1' ? 8 : -8;
      const step = square + delta;
      if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
        pseudo = pseudo.with(step);
        const canDoubleStep = this.turn === 'p1' ? square < 16 : square >= 64 - 16;
        const doubleStep = step + delta;
        if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
          pseudo = pseudo.with(doubleStep);
        }
      }
      if (defined(this.epSquare) && this.canCaptureEp(square, ctx)) {
        const pawn = this.epSquare - delta;
        if (ctx.checkers.isEmpty() || ctx.checkers.singleSquare() === pawn) {
          legal = SquareSet.fromSquare(this.epSquare);
        }
      }
    } else if (piece.role === 'b-piece') pseudo = bishopAttacks(square, this.board.occupied);
    else if (piece.role === 'n-piece') pseudo = knightAttacks(square);
    else if (piece.role === 'r-piece') pseudo = rookAttacks(square, this.board.occupied);
    else if (piece.role === 'q-piece') pseudo = queenAttacks(square, this.board.occupied);
    else pseudo = kingAttacks(square);

    pseudo = pseudo.diff64(this.board[this.turn]);

    if (defined(ctx.king)) {
      if (piece.role === 'k-piece') {
        const occ = this.board.occupied.without(square);
        for (const to of pseudo) {
          if (this.kingAttackers(to, opposite(this.turn), occ).nonEmpty()) pseudo = pseudo.without(to);
        }
        return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
      }

      if (ctx.checkers.nonEmpty()) {
        const checker = ctx.checkers.singleSquare();
        if (!defined(checker)) return SquareSet.empty();
        pseudo = pseudo.intersect(between(checker, ctx.king).with(checker));
      }

      if (ctx.blockers.has(square)) pseudo = pseudo.intersect(ray(square, ctx.king));
    }

    if (legal) pseudo = pseudo.union(legal);
    return pseudo;
  }

  isVariantEnd(): boolean {
    return false;
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    return;
  }

  hasInsufficientMaterial(playerIndex: PlayerIndex): boolean {
    if (this.board[playerIndex].intersect(this.board['p-piece'].union(this.board.rooksAndQueens())).nonEmpty())
      return false;
    if (this.board[playerIndex].intersects(this.board['n-piece'])) {
      return (
        this.board[playerIndex].size() <= 2 &&
        this.board[opposite(playerIndex)].diff64(this.board['k-piece']).diff64(this.board['q-piece']).isEmpty()
      );
    }
    if (this.board[playerIndex].intersects(this.board['b-piece'])) {
      const samePlayerIndex =
        !this.board['b-piece'].intersects(SquareSet.darkSquares64()) ||
        !this.board['b-piece'].intersects(SquareSet.lightSquares64());
      return samePlayerIndex && this.board['p-piece'].isEmpty() && this.board['n-piece'].isEmpty();
    }
    return true;
  }
}
