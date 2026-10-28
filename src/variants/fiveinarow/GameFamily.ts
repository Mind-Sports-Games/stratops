import { Result } from '@badrap/result';
import type { Context, PositionError } from '../../chess';
import {
  type FenError,
  type FiveInARowCaptures,
  fiveInARowDropped,
  fiveInARowNextColour,
  fiveInARowOtherColour,
  fiveInARowScored,
  fiveInARowSeatOf,
  fiveInARowSeatToMove,
  parseFen,
} from '../../fen';
import type { Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import {
  type BoardDimensions,
  isDrop,
  type Move,
  type OpeningStep,
  type Outcome,
  type Piece,
  type PlayerIndex,
  type Role,
  type Square,
} from '../../types';
import { makeSquare, opposite, roleToChar } from '../../util';
import { ExtendedMoveInfo, GameFamilyKey, LexicalUci, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';
import { type Grid, isForbidden, LINE_DIRECTIONS, run, step } from './forbidden';

const CAPTURE_DIRECTIONS: [number, number][] = [
  ...LINE_DIRECTIONS,
  ...LINE_DIRECTIONS.map(([df, dr]): [number, number] => [-df, -dr]),
];

const TARAGUCHI_RESTRICTED_STONES = 5;
const TARAGUCHI_SWAPPED_STONES = 5;
const TARAGUCHI_OFFERED_STONES = 10;

interface FiveWindow {
  cells: Square[];
  ends: Square[];
}

interface Settled {
  winner: PlayerIndex | undefined;
  drawn: boolean;
}

const fiveWindowsBySize = new Map<string, FiveWindow[]>();

// gomoku and pente open with swap2; renju with Taraguchi-10
export type FiveInARowOpening = 'swap2' | 'taraguchi10';

// The stones live in `stones`, not `board`: a SquareSet holds 128 squares and this board has 225 or 361.
export abstract class GameFamily extends Variant {
  static override height: BoardDimensions['ranks'] = 15;
  static override width: BoardDimensions['files'] = 15;
  static override family: GameFamilyKey = GameFamilyKey.fiveinarow;
  static override playerColors: Record<PlayerIndex, string> = {
    p1: 'black',
    p2: 'white',
  };
  static override playerFENChars: Record<PlayerIndex, 'b' | 'w'> = {
    p1: 'b',
    p2: 'w',
  };
  static opening: FiveInARowOpening = 'swap2';
  static captureTarget: number | undefined = undefined;
  static forbiddenActions = false;

  stones: Map<Square, Role> = new Map();
  offered: Square[] = [];
  blackSeat: PlayerIndex = 'p1';
  openingStep: OpeningStep = 'o';
  captures: FiveInARowCaptures = { p1: 0, p2: 0 };
  // a forbidden drop loses on the spot; the fen records only the loss, as the opening step z
  forbiddenDrop: Square | undefined = undefined;
  // worked out on first asking, and forgotten by every action
  private settled: Settled | undefined = undefined;

  static override default(): GameFamily {
    return this.fromSetup(parseFen(this.rules)(this.getInitialFen('p1')).unwrap()).unwrap();
  }

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    if (move.uci.includes('@')) return move.uci.split('@')[1];
    return move.uci;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.uci;
  }

  static override getVariantKeys(): VariantKey[] {
    return [VariantKey.gomoku, VariantKey.pente, VariantKey.renju];
  }

  static override getEmptyBoardFen(): string {
    return Array(this.height).fill(`${this.width}`).join('/');
  }

  static override getInitialBoardFen(): string {
    return this.getEmptyBoardFen();
  }

  static override getEmptyFen(playerIndex: PlayerIndex): string {
    return this.getInitialFen(playerIndex);
  }

  static initialOpeningStep(): OpeningStep {
    return this.opening === 'taraguchi10' ? 'p' : 'o';
  }

  // the opening always starts with P1 holding black, whoever is asking
  static override getInitialFen(_playerIndex: PlayerIndex): string {
    const captures = fiveInARowScored(this.rules) ? ' 0 0' : '';
    return `${this.getInitialBoardFen()} b 1 ${this.initialOpeningStep()}${captures} 1`;
  }

  static override parseFen(fen: string): Result<Setup, FenError> {
    return parseFen(this.rules)(fen);
  }

  // a stone's letter is its colour, so its owner can only be read with the fen's black seat
  static override getPiecesCoordinates(fen: string, playerIndex: PlayerIndex): { piece: string; coord: string }[] {
    return this.parseFen(fen).unwrap(
      setup =>
        [...(setup.stones ?? [])]
          .filter(([, role]) => (role === 'b-piece') === (setup.blackSeat === playerIndex))
          .sort(([a], [b]) => a - b)
          .map(([square, role]) => ({ piece: roleToChar(role).toUpperCase(), coord: makeSquare(this.rules)(square) })),
      () => [],
    );
  }

  // without a fen there is no black seat to read, so a stone goes to the seat holding its colour at the start
  static override isPieceOfPlayer(piece: string, playerIndex: PlayerIndex): boolean {
    return piece.toLowerCase() === this.playerFENChars[playerIndex];
  }

  static override parseLexicalUci(uci: string): LexicalUci | undefined {
    if (!uci || uci === 'swap' || uci === 'swap2' || uci === 'offer10') return undefined;
    return super.parseLexicalUci(uci);
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return (super.fromSetup(setup) as Result<GameFamily, PositionError>).map(pos => {
      pos.pockets = undefined;
      pos.stones = new Map(setup.stones);
      pos.offered = [...(setup.offered ?? [])];
      pos.blackSeat = setup.blackSeat ?? 'p1';
      pos.openingStep = setup.openingStep ?? '-';
      pos.captures = { p1: setup.p1Captures ?? 0, p2: setup.p2Captures ?? 0 };
      pos.forbiddenDrop = undefined;
      return pos;
    });
  }

  static winningLine(_role: Role, length: number): boolean {
    return length >= 5;
  }

  private static fiveWindows(): FiveWindow[] {
    const size = `${this.width}x${this.height}`;
    const cached = fiveWindowsBySize.get(size);
    if (cached) return cached;
    const windows: FiveWindow[] = [];
    for (let square = 0; square < this.width * this.height; square++) {
      for (const [df, dr] of LINE_DIRECTIONS) {
        if (step(this, square, df * 4, dr * 4) === undefined) continue;
        const cells = [0, 1, 2, 3, 4].map(n => step(this, square, df * n, dr * n)!);
        const ends = [step(this, square, -df, -dr), step(this, square, df * 5, dr * 5)]
          .filter((end): end is Square => end !== undefined);
        windows.push({ cells, ends });
      }
    }
    fiveWindowsBySize.set(size, windows);
    return windows;
  }

  // a window that would join a stone of its own colour beyond either end can only ever make an overline
  private static windowOpenTo(stones: Map<Square, Role>, role: Role, window: FiveWindow): boolean {
    return window.cells.every(square => (stones.get(square) ?? role) === role)
      && (this.winningLine(role, 6) || !window.ends.some(square => stones.get(square) === role));
  }

  // not a proven minimum, only a count below which a blocked board is too rare to scan for: each row
  // splits into width / 5 stretches, and a stretch usually holds a stone of both colours once blocked
  private static fewestStonesBlockingEveryFive(): number {
    return 2 * this.height * Math.floor(this.width / 5);
  }

  // captures can reopen a blocked line, so only a variant without them can run out of fives
  static noFivePossible(stones: Map<Square, Role>): boolean {
    return this.captureTarget === undefined && stones.size >= this.fewestStonesBlockingEveryFive()
      && !this.fiveWindows().some(window =>
        (['b-piece', 'w-piece'] as const).some(role => this.windowOpenTo(stones, role, window))
      );
  }

  static grid(stones: Map<Square, Role>): Grid {
    return { stones, width: this.width, height: this.height };
  }

  // counted only from the first stone of each run, so a long line is measured once
  static colourWithLine(stones: Map<Square, Role>): Role | undefined {
    const grid = this.grid(stones);
    for (const [square, role] of stones) {
      for (const [df, dr] of LINE_DIRECTIONS) {
        const back = step(grid, square, -df, -dr);
        const continuesBack = back !== undefined && stones.get(back) === role;
        if (!continuesBack && this.winningLine(role, run(grid, square, df, dr, role).length)) return role;
      }
    }
    return undefined;
  }

  private get variant(): typeof GameFamily {
    return this.constructor as typeof GameFamily;
  }

  private points(): Square[] {
    return [...Array(this.variant.width * this.variant.height).keys()];
  }

  // black and white alternate from the first stone, so the stones dropped of each say which colour comes next
  nextColour(): Role {
    return fiveInARowNextColour(this.stones, this.blackSeat, this.captures);
  }

  droppedCount(): number {
    return fiveInARowDropped(this.stones, this.blackSeat, this.captures, 'b-piece')
      + fiveInARowDropped(this.stones, this.blackSeat, this.captures, 'w-piece');
  }

  seatOf(role: Role): PlayerIndex {
    return fiveInARowSeatOf(role, this.blackSeat);
  }

  stoneAt(square: Square): Piece | undefined {
    const role = this.stones.get(square);
    return role && { role, playerIndex: this.seatOf(role) };
  }

  // the points the next stone may be dropped on; after offer10, only the offered ones
  emptyPoints(): Square[] {
    return this.points().filter(this.dropAllowed());
  }

  private dropAllowed(): (square: Square) => boolean {
    if (this.isVariantEnd()) return () => false;
    if (this.openingStep === 'k') return square => this.offered.includes(square);
    const openingAllows = this.openingAllowsDrop();
    return square => !this.stones.has(square) && openingAllows(square);
  }

  offeredPoints(): Square[] {
    return [...this.offered];
  }

  // the empty points where black's drop would lose on the spot
  forbiddenPoints(): Square[] {
    if (
      !this.variant.forbiddenActions || this.nextColour() !== 'b-piece' || this.openingStep === 'x'
      || this.openingStep === 'k'
    ) return [];
    return this.emptyPoints().filter(square => this.isForbiddenDrop('b-piece', square));
  }

  canSwap(): boolean {
    if (this.isVariantEnd()) return false;
    return this.variant.opening === 'swap2'
      ? this.openingStep === 'c' || this.openingStep === 'f'
      : this.openingStep === 'q';
  }

  canSwap2(): boolean {
    return !this.isVariantEnd() && this.variant.opening === 'swap2' && this.openingStep === 'c';
  }

  canOffer10(): boolean {
    return !this.isVariantEnd() && this.variant.opening === 'taraguchi10' && this.inTaraguchiPlacing()
      && this.droppedCount() === 4;
  }

  isBoardFull(): boolean {
    return this.stones.size === this.variant.width * this.variant.height;
  }

  isDrawn(): boolean {
    return this.settle().drawn;
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

  override dests(_square: Square, _ctx?: Context): SquareSet {
    return SquareSet.empty();
  }

  // a SquareSet cannot name every point of the board; legal drops are the emptyPoints
  override dropDests(_ctx?: Context): SquareSet {
    return SquareSet.empty();
  }

  override isLegal(move: Move, _ctx?: Context): boolean {
    return isDrop(move) && move.role === this.nextColour()
      && move.to >= 0 && move.to < this.variant.width * this.variant.height && this.dropAllowed()(move.to);
  }

  override play(move: Move): void {
    if (!isDrop(move)) return;
    if (this.openingStep === 'x') {
      this.offered = [...this.offered, move.to].sort((a, b) => a - b);
      if (this.offered.length === TARAGUCHI_OFFERED_STONES) this.openingStep = 'k';
      this.endAction();
      return;
    }
    // white drops black's fifth on one offered point, the other nine go, and white drops the sixth
    if (this.openingStep === 'k') {
      this.stones.set(move.to, move.role);
      this.offered = [];
      this.openingStep = 'p';
      this.endAction();
      return;
    }
    const forbidden = this.isForbiddenDrop(move.role, move.to);
    this.stones.set(move.to, move.role);
    this.capture(move.role, move.to);
    if (forbidden) {
      this.forbiddenDrop = move.to;
      this.openingStep = 'z';
    } else {
      this.openingStep = this.stepAfterDrop();
      // the swap2 pair ends with the colours exchanged, exactly as a swap makes
      if (this.variant.opening === 'swap2' && this.openingStep === 'f') this.swapColours();
    }
    this.endAction();
  }

  // the stones and the captures keep their colour; each seat takes over the colour the other held
  swap(): void {
    this.swapColours();
    this.openingStep = this.variant.opening === 'swap2' ? '-' : 'p';
    this.endAction();
  }

  swap2(): void {
    this.openingStep = 's';
    this.endAction();
  }

  offer10(): void {
    this.openingStep = 'x';
    this.endAction();
  }

  private inTaraguchiPlacing(): boolean {
    return this.openingStep === 'p' || this.openingStep === 'q';
  }

  // a step ends on the stones dropped, not those on the board, since a pente drop can capture
  private stepAfterDrop(): OpeningStep {
    const dropped = this.droppedCount();
    if (this.variant.opening === 'taraguchi10') {
      return this.inTaraguchiPlacing() && dropped <= TARAGUCHI_SWAPPED_STONES ? 'q' : '-';
    }
    if (this.openingStep === 'o') return dropped === 3 ? 'c' : 'o';
    if (this.openingStep === 's') return dropped === 5 ? 'f' : 's';
    return '-';
  }

  // the nth stone of Taraguchi-10 goes within the (2n - 1) square about the centre, until the fifth
  private openingAllowsDrop(): (square: Square) => boolean {
    if (this.variant.opening === 'swap2') return () => true;
    if (this.openingStep === 'x') return this.offerAllowed();
    const dropped = this.droppedCount();
    if (!this.inTaraguchiPlacing() || dropped >= TARAGUCHI_RESTRICTED_STONES) return () => true;
    const { width, height } = this.variant;
    return square => {
      const fileDistance = Math.abs((square % width) - Math.floor(width / 2));
      const rankDistance = Math.abs(Math.floor(square / width) - Math.floor(height / 2));
      return Math.max(fileDistance, rankDistance) <= dropped;
    };
  }

  private offerAllowed(): (square: Square) => boolean {
    const symmetries = this.symmetries();
    return square =>
      !this.offered.includes(square) && !symmetries.some(symmetry => this.offered.includes(symmetry(square)));
  }

  // the board's rotations and reflections that leave every stone where it was, colour and all
  private symmetries(): ((square: Square) => Square)[] {
    const { width } = this.variant;
    const last = width - 1;
    const transforms: ((file: number, rank: number) => [number, number])[] = [
      (f, r) => [f, r],
      (f, r) => [last - f, r],
      (f, r) => [f, last - r],
      (f, r) => [last - f, last - r],
      (f, r) => [r, f],
      (f, r) => [last - r, f],
      (f, r) => [r, last - f],
      (f, r) => [last - r, last - f],
    ];
    return transforms
      .map(transform => (square: Square) => {
        const [file, rank] = transform(square % width, Math.floor(square / width));
        return file + rank * width;
      })
      .filter(symmetry => [...this.stones].every(([square, role]) => this.stones.get(symmetry(square)) === role));
  }

  private isForbiddenDrop(role: Role, square: Square): boolean {
    return this.variant.forbiddenActions && role === 'b-piece'
      && isForbidden(this.variant.grid(this.stones), square);
  }

  // exactly two of the other colour, closed off at the far end by the colour just dropped
  private capture(role: Role, at: Square): void {
    if (this.variant.captureTarget === undefined) return;
    const other = fiveInARowOtherColour(role);
    const grid = this.variant.grid(this.stones);
    for (const [df, dr] of CAPTURE_DIRECTIONS) {
      const first = step(grid, at, df, dr);
      const second = first === undefined ? undefined : step(grid, first, df, dr);
      const closer = second === undefined ? undefined : step(grid, second, df, dr);
      if (
        first !== undefined && second !== undefined && closer !== undefined
        && this.stones.get(first) === other && this.stones.get(second) === other && this.stones.get(closer) === role
      ) {
        this.stones.delete(first);
        this.stones.delete(second);
        this.captures[this.seatOf(role)] += 2;
      }
    }
  }

  private swapColours(): void {
    this.blackSeat = opposite(this.blackSeat);
    this.captures = { p1: this.captures.p2, p2: this.captures.p1 };
  }

  private endAction(): void {
    this.settled = undefined;
    const next = fiveInARowSeatToMove(this.stones, this.blackSeat, this.captures, this.openingStep);
    this.halfmoves += 1;
    if (next !== this.turn && next === 'p1') this.fullmoves += 1;
    this.turn = next;
  }

  override toSetup(): Setup {
    return {
      ...super.toSetup(),
      pockets: undefined,
      stones: new Map(this.stones),
      offered: [...this.offered],
      blackSeat: this.blackSeat,
      openingStep: this.openingStep,
      p1Captures: this.captures.p1,
      p2Captures: this.captures.p2,
    };
  }

  override clone(): GameFamily {
    const pos = super.clone() as GameFamily;
    pos.stones = new Map(this.stones);
    pos.offered = [...this.offered];
    pos.blackSeat = this.blackSeat;
    pos.openingStep = this.openingStep;
    pos.captures = { ...this.captures };
    pos.forbiddenDrop = this.forbiddenDrop;
    pos.settled = this.settled;
    return pos;
  }

  protected override validate(): Result<undefined, PositionError> {
    return Result.ok(undefined);
  }

  winner(): PlayerIndex | undefined {
    return this.settle().winner;
  }

  private settle(): Settled {
    return this.settled ??= {
      winner: this.findWinner(),
      drawn: this.isBoardFull() || this.variant.noFivePossible(this.stones),
    };
  }

  private findWinner(): PlayerIndex | undefined {
    const colour = this.variant.colourWithLine(this.stones);
    if (colour) return this.seatOf(colour);
    if (this.openingStep === 'z') return this.seatOf('w-piece');
    const target = this.variant.captureTarget;
    if (target === undefined) return undefined;
    return (['p1', 'p2'] as const).find(seat => this.captures[seat] >= target);
  }

  override isVariantEnd(): boolean {
    return this.winner() !== undefined || this.isDrawn();
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
}
