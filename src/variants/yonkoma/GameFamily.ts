import { Result } from '@badrap/result';
import type { Context, Position } from '../../chess';
import { IllegalSetup, PositionError } from '../../chess';
import { type FenError, makeYonkomaFen, parseFen } from '../../fen';
import type { Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import {
  type BoardDimensions,
  isDrop,
  type Move,
  type Outcome,
  type Piece,
  type PlayerIndex,
  type Square,
} from '../../types';
import { makeSquare, opposite, squareFile, squareRank } from '../../util';
import { type ExtendedMoveInfo, GameFamilyKey, type LexicalUci, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

const DIAGONALS: [number, number][] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

// Yonkoma (Mark Steere, 2026): two checkers a side that slide like bishops. A move must
// bring the checker closer to the two enemy checkers (the sum of its king distances to
// them falls) or keep that sum and take the checker farther from its partner. Whoever
// completes a crosscut (all four checkers in a 2x2 block, each side on its own diagonal)
// loses, so the player to move in a crosscut has won.
//
// The checkers live in `checkers`, not `board`: a SquareSet holds 128 squares and the
// 12x12 board has 144. The moves come from destinations() and allDestinations(), which
// return squares; hasDests() and allDests() are derived from them, with the limit that on
// the 12x12 board a SquareSet cannot hold the squares from i11 up. lila does not depend on
// either: the round and the analysis board take their destinations from the server.
export abstract class GameFamily extends Variant {
  checkers: Map<Square, Piece> = new Map();

  static override height: BoardDimensions['ranks'] = 10;
  static override width: BoardDimensions['files'] = 10;
  static override family: GameFamilyKey = GameFamilyKey.yonkoma;

  static override default(): GameFamily {
    return this.fromSetup(parseFen(this.rules)(this.getInitialFen('p1')).unwrap()).unwrap();
  }

  static override getVariantKeys(): VariantKey[] {
    return [VariantKey.yonkoma10x10, VariantKey.yonkoma12x12];
  }

  // a move is written as its uci, "a1e5"; a skipped turn as "pass"
  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    return move.uci === 'pass' ? 'PASS' : move.uci;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.uci;
  }

  static override getEmptyBoardFen(): string {
    return Array(this.height).fill(`${this.width}`).join('/');
  }

  // P2's checkers in the top corners, P1's in the bottom corners
  static override getInitialBoardFen(): string {
    const inner = this.width - 2;
    const middle = Array(this.height - 2).fill(`${this.width}`);
    return [`c${inner}C`, ...middle, `C${inner}c`].join('/');
  }

  static override getEmptyFen(playerIndex: PlayerIndex): string {
    return `${this.getEmptyBoardFen()} ${this.playerFENChars[playerIndex]} 1`;
  }

  static override getInitialFen(_playerIndex: PlayerIndex): string {
    return `${this.getInitialBoardFen()} w 1`;
  }

  static override parseFen(fen: string): Result<Setup, FenError> {
    return parseFen(this.rules)(fen);
  }

  static override getPiecesCoordinates(fen: string, playerIndex: PlayerIndex): { piece: string; coord: string }[] {
    return this.parseFen(fen).unwrap(
      setup =>
        [...(setup.checkers ?? [])]
          .filter(([, piece]) => piece.playerIndex === playerIndex)
          .sort(([a], [b]) => a - b)
          .map(([square]) => ({ piece: 'C', coord: makeSquare(this.rules)(square) })),
      () => [],
    );
  }

  static override parseLexicalUci(uci: string): LexicalUci | undefined {
    if (!uci || uci === 'pass') return undefined;
    return super.parseLexicalUci(uci);
  }

  // the base class builds the position from the (empty) board and runs validate(), which
  // has nothing to check here; the checkers are then set and checked by validateYonkoma
  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return (super.fromSetup(setup) as Result<GameFamily, PositionError>).chain(pos => {
      pos.pockets = undefined;
      pos.checkers = new Map(setup.checkers);
      return pos.validateYonkoma().map(_ => pos);
    });
  }

  private get variant(): typeof GameFamily {
    return this.constructor as typeof GameFamily;
  }

  // the number of king moves between two squares
  private kingDistance(a: Square, b: Square): number {
    const file = squareFile(this.rules);
    const rank = squareRank(this.rules);
    return Math.max(Math.abs(file(a) - file(b)), Math.abs(rank(a) - rank(b)));
  }

  private isLight(square: Square): boolean {
    return (squareFile(this.rules)(square) + squareRank(this.rules)(square)) % 2 === 1;
  }

  checkersOf(playerIndex: PlayerIndex): Square[] {
    return [...this.checkers]
      .filter(([, piece]) => piece.playerIndex === playerIndex)
      .map(([square]) => square)
      .sort((a, b) => a - b);
  }

  // the empty squares a checker can slide to along its diagonals, up to the first checker
  // or the edge of the board
  private slides(from: Square): Square[] {
    const files = this.variant.width;
    const ranks = this.variant.height;
    const file = squareFile(this.rules)(from);
    const rank = squareRank(this.rules)(from);
    const out: Square[] = [];
    for (const [df, dr] of DIAGONALS) {
      let f = file + df;
      let r = rank + dr;
      while (f >= 0 && f < files && r >= 0 && r < ranks) {
        const square = f + r * files;
        if (this.checkers.has(square)) break;
        out.push(square);
        f += df;
        r += dr;
      }
    }
    return out;
  }

  // the rule applied to one checker, given its partner and the two enemy checkers
  private destinationsOf(from: Square, partner: Square | undefined, enemies: Square[]): Square[] {
    const sumBefore = enemies.reduce((sum, e) => sum + this.kingDistance(from, e), 0);
    const partnerBefore = partner === undefined ? 0 : this.kingDistance(from, partner);
    return this.slides(from).filter(to => {
      const sumAfter = enemies.reduce((sum, e) => sum + this.kingDistance(to, e), 0);
      const partnerAfter = partner === undefined ? 0 : this.kingDistance(to, partner);
      return sumAfter < sumBefore || (sumAfter === sumBefore && partnerAfter > partnerBefore);
    });
  }

  // the destinations the rules allow the checker on `from`
  destinations(from: Square): Square[] {
    const piece = this.checkers.get(from);
    if (!piece || piece.playerIndex !== this.turn || this.isCrosscut()) return [];
    const partner = this.checkersOf(piece.playerIndex).find(s => s !== from);
    return this.destinationsOf(from, partner, this.checkersOf(opposite(piece.playerIndex)));
  }

  // every legal move of the player to move, by origin; empty when he must pass
  allDestinations(): Map<Square, Square[]> {
    const all = new Map<Square, Square[]>();
    if (this.isCrosscut()) return all;
    const mine = this.checkersOf(this.turn);
    const enemies = this.checkersOf(opposite(this.turn));
    for (const from of mine) {
      const dests = this.destinationsOf(from, mine.find(s => s !== from), enemies);
      if (dests.length) all.set(from, dests);
    }
    return all;
  }

  mustPass(): boolean {
    return !this.isCrosscut() && this.allDestinations().size === 0;
  }

  // all four checkers in a 2x2 block: as P1's checkers stand on dark squares and P2's on
  // light ones, each side then holds one diagonal of the block
  isCrosscut(): boolean {
    if (this.checkers.size !== 4) return false;
    const file = squareFile(this.rules);
    const rank = squareRank(this.rules);
    const all = [...this.checkers.keys()];
    const files = all.map(file);
    const ranks = all.map(rank);
    return Math.max(...files) - Math.min(...files) === 1 && Math.max(...ranks) - Math.min(...ranks) === 1;
  }

  override ctx(): Context {
    return {
      king: undefined,
      blockers: SquareSet.empty(),
      checkers: SquareSet.empty(),
      variantEnd: this.isVariantEnd(),
      mustCapture: false,
    };
  }

  override dests(square: Square, _ctx?: Context): SquareSet {
    return this.destinations(square).reduce((set, to) => set.with(to), SquareSet.empty());
  }

  override dropDests(_ctx?: Context): SquareSet {
    return SquareSet.empty();
  }

  override hasDests(_ctx?: Context): boolean {
    return this.allDestinations().size > 0;
  }

  override allDests(_ctx?: Context): Map<Square, SquareSet> {
    const all = new Map<Square, SquareSet>();
    for (const [from, dests] of this.allDestinations()) {
      all.set(from, dests.reduce((set, to) => set.with(to), SquareSet.empty()));
    }
    return all;
  }

  override isLegal(move: Move, _ctx?: Context): boolean {
    return !isDrop(move) && this.destinations(move.from).includes(move.to);
  }

  override play(move: Move): void {
    if (isDrop(move)) return;
    const piece = this.checkers.get(move.from);
    if (!piece) return;
    this.checkers.delete(move.from);
    this.checkers.set(move.to, piece);
    this.endTurn();
  }

  // the skipped turn of a player with no legal move; nothing else may pass
  pass(): void {
    if (!this.mustPass()) return;
    this.endTurn();
  }

  private endTurn(): void {
    if (this.turn === 'p2') this.fullmoves += 1;
    this.turn = opposite(this.turn);
    this.halfmoves += 1;
  }

  override toSetup(): Setup {
    return {
      ...super.toSetup(),
      pockets: undefined,
      checkers: new Map(this.checkers),
    };
  }

  override clone(): GameFamily {
    const pos = super.clone() as GameFamily;
    pos.checkers = new Map(this.checkers);
    return pos;
  }

  // the same checkers on the same squares, the same player to move
  override equalsIgnoreMoves(other: Position): boolean {
    return (
      other instanceof GameFamily
      && this.rules === other.rules
      && this.turn === other.turn
      && this.checkers.size === other.checkers.size
      && [...this.checkers].every(([square, piece]) => {
        const theirs = other.checkers.get(square);
        return !!theirs && theirs.role === piece.role && theirs.playerIndex === piece.playerIndex;
      })
    );
  }

  // the board is empty by design (the checkers are elsewhere), so nothing to check here
  protected override validate(): Result<undefined, PositionError> {
    return Result.ok(undefined);
  }

  // two checkers a side, P1's on dark squares and P2's on light ones, all on the board
  protected validateYonkoma(): Result<undefined, PositionError> {
    const { width, height } = this.variant;
    const p1 = this.checkersOf('p1');
    const p2 = this.checkersOf('p2');
    const onBoard = (s: Square) => s >= 0 && s < width * height;
    if (p1.length !== 2 || p2.length !== 2 || this.checkers.size !== 4) {
      return Result.err(new PositionError(IllegalSetup.Variant));
    }
    if ([...this.checkers.values()].some(piece => piece.role !== 'c-piece')) {
      return Result.err(new PositionError(IllegalSetup.Variant));
    }
    if (![...p1, ...p2].every(onBoard)) return Result.err(new PositionError(IllegalSetup.Variant));
    if (p1.some(s => this.isLight(s)) || p2.some(s => !this.isLight(s))) {
      return Result.err(new PositionError(IllegalSetup.Variant));
    }
    return Result.ok(undefined);
  }

  winner(): PlayerIndex | undefined {
    return this.isCrosscut() ? this.turn : undefined;
  }

  override isVariantEnd(): boolean {
    return this.isCrosscut();
  }

  override variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;
    return { winner: this.winner() };
  }

  override isEnd(ctx?: Context): boolean {
    return ctx ? ctx.variantEnd : this.isVariantEnd();
  }

  override isCheckmate(): boolean {
    return false;
  }

  override isStalemate(): boolean {
    return false;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }

  override outcome(ctx?: Context): Outcome | undefined {
    return this.variantOutcome(ctx);
  }

  // the fen as the server writes it
  fen(): string {
    return makeYonkomaFen(this.rules)(this.toSetup());
  }
}
