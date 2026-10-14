import { Result } from '@badrap/result';
import type { Context, PositionError } from '../../chess';
import {
  type FenError,
  type FiveInARowCaptures,
  fiveInARowDropped,
  fiveInARowNextColour,
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
import { isForbidden } from './forbidden';

const LINE_DIRECTIONS: [number, number][] = [[1, 0], [0, 1], [1, 1], [1, -1]];

const CAPTURE_DIRECTIONS: [number, number][] = [
  ...LINE_DIRECTIONS,
  ...LINE_DIRECTIONS.map(([df, dr]): [number, number] => [-df, -dr]),
];

const TARAGUCHI_RESTRICTED_STONES = 5;
const TARAGUCHI_SWAPPED_STONES = 5;
const TARAGUCHI_OFFERED_STONES = 10;

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
  static forbiddenMoves = false;

  stones: Map<Square, Role> = new Map();
  offered: Square[] = [];
  blackSeat: PlayerIndex = 'p1';
  openingStep: OpeningStep = 'o';
  captures: FiveInARowCaptures = { p1: 0, p2: 0 };
  // a forbidden drop loses on the spot, and the fen does not record it
  forbiddenDrop: Square | undefined = undefined;

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    if (move.uci.includes('@')) return move.uci.split('@')[1];
    if (move.uci.startsWith('ss:')) return move.uci.substring(3);
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

  // a pick puts the chosen offered stone on the board as black's fifth
  static override parseLexicalUci(uci: string): LexicalUci | undefined {
    if (!uci || uci === 'swap' || uci === 'swap2' || uci === 'offer10') return undefined;
    if (uci.startsWith('ss:')) {
      const picked = uci.substring(3) as LexicalUci['to'];
      return { from: picked, to: picked, dropRole: 'b-piece' };
    }
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

  private static onBoard(file: number, rank: number): boolean {
    return file >= 0 && file < this.width && rank >= 0 && rank < this.height;
  }

  private static runLength(stones: Map<Square, Role>, from: Square, role: Role, df: number, dr: number): number {
    let file = from % this.width;
    let rank = Math.floor(from / this.width);
    let length = 0;
    while (this.onBoard(file, rank) && stones.get(rank * this.width + file) === role) {
      length++;
      file += df;
      rank += dr;
    }
    return length;
  }

  // counted only from the first stone of each run, so a long line is measured once
  static colourWithLine(stones: Map<Square, Role>): Role | undefined {
    for (const [square, role] of stones) {
      const file = square % this.width;
      const rank = Math.floor(square / this.width);
      for (const [df, dr] of LINE_DIRECTIONS) {
        const continuesBack = this.onBoard(file - df, rank - dr)
          && stones.get((rank - dr) * this.width + file - df) === role;
        if (!continuesBack && this.winningLine(role, this.runLength(stones, square, role, df, dr))) return role;
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

  private step(from: Square, df: number, dr: number): Square | undefined {
    const { width, height } = this.variant;
    const file = (from % width) + df;
    const rank = Math.floor(from / width) + dr;
    return file >= 0 && file < width && rank >= 0 && rank < height ? file + rank * width : undefined;
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

  // the points the next stone may be dropped on
  emptyPoints(): Square[] {
    if (this.isVariantEnd() || this.openingStep === 'k') return [];
    return this.points().filter(square => !this.stones.has(square) && this.openingAllowsDrop(square));
  }

  offeredPoints(): Square[] {
    return [...this.offered];
  }

  // the empty points where black's drop would lose on the spot
  forbiddenPoints(): Square[] {
    if (
      !this.variant.forbiddenMoves || this.isVariantEnd() || this.nextColour() !== 'b-piece'
      || this.openingStep === 'x'
    ) return [];
    return this.points().filter(square => !this.stones.has(square) && this.isForbiddenDrop('b-piece', square));
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

  canSelectSquares(): boolean {
    return !this.isVariantEnd() && this.openingStep === 'k';
  }

  isBoardFull(): boolean {
    return this.stones.size === this.variant.width * this.variant.height;
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
    return isDrop(move) && move.role === this.nextColour() && this.emptyPoints().includes(move.to);
  }

  override play(move: Move): void {
    if (!isDrop(move)) return;
    if (this.openingStep === 'x') {
      this.offered = [...this.offered, move.to].sort((a, b) => a - b);
      if (this.offered.length === TARAGUCHI_OFFERED_STONES) this.openingStep = 'k';
      this.endAction();
      return;
    }
    const forbidden = this.isForbiddenDrop(move.role, move.to);
    this.stones.set(move.to, move.role);
    this.capture(move.role, move.to);
    if (forbidden) this.forbiddenDrop = move.to;
    this.openingStep = this.stepAfterDrop();
    // the swap2 pair ends with the colours exchanged, exactly as a swap makes
    if (this.variant.opening === 'swap2' && this.openingStep === 'f') this.swapColours();
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

  // white keeps one offered stone as black's fifth, and goes on to drop the sixth
  selectSquares(squares: Square[]): void {
    if (!this.canSelectSquares() || squares.length !== 1 || !this.offered.includes(squares[0])) return;
    this.stones.set(squares[0], 'b-piece');
    this.offered = [];
    this.openingStep = 'p';
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
  private openingAllowsDrop(square: Square): boolean {
    if (this.variant.opening === 'swap2') return true;
    if (this.openingStep === 'x') return this.offerAllowed(square);
    const dropped = this.droppedCount();
    if (!this.inTaraguchiPlacing() || dropped >= TARAGUCHI_RESTRICTED_STONES) return true;
    const { width, height } = this.variant;
    const fileDistance = Math.abs((square % width) - Math.floor(width / 2));
    const rankDistance = Math.abs(Math.floor(square / width) - Math.floor(height / 2));
    return Math.max(fileDistance, rankDistance) <= dropped;
  }

  private offerAllowed(square: Square): boolean {
    if (this.offered.includes(square)) return false;
    const mirrors = this.symmetries().map(symmetry => symmetry(square));
    return !this.offered.some(offered => mirrors.includes(offered));
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
    return this.variant.forbiddenMoves && role === 'b-piece'
      && isForbidden({ stones: this.stones, width: this.variant.width, height: this.variant.height }, square);
  }

  // exactly two of the other colour, closed off at the far end by the colour just dropped
  private capture(role: Role, at: Square): void {
    if (this.variant.captureTarget === undefined) return;
    const other: Role = role === 'b-piece' ? 'w-piece' : 'b-piece';
    for (const [df, dr] of CAPTURE_DIRECTIONS) {
      const first = this.step(at, df, dr);
      const second = first === undefined ? undefined : this.step(first, df, dr);
      const closer = second === undefined ? undefined : this.step(second, df, dr);
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
    return pos;
  }

  protected override validate(): Result<undefined, PositionError> {
    return Result.ok(undefined);
  }

  winner(): PlayerIndex | undefined {
    const colour = this.variant.colourWithLine(this.stones);
    if (colour) return this.seatOf(colour);
    if (this.forbiddenDrop !== undefined) return this.seatOf('w-piece');
    const target = this.variant.captureTarget;
    if (target === undefined) return undefined;
    return (['p1', 'p2'] as const).find(seat => this.captures[seat] >= target);
  }

  override isVariantEnd(): boolean {
    return this.winner() !== undefined || this.isBoardFull();
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
