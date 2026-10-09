import { Result } from '@badrap/result';
import type { Context, PositionError } from '../../chess';
import { type FenError, gomokuNextColour, gomokuSeatToMove, parseFen } from '../../fen';
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

const LINE_DIRECTIONS: [number, number][] = [[1, 0], [0, 1], [1, 1], [1, -1]];

// The stones live in `stones`, not `board`: a SquareSet holds 128 squares and this board has 225.
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

  stones: Map<Square, Role> = new Map();
  blackSeat: PlayerIndex = 'p1';
  openingStep: OpeningStep = 'o';

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    return move.uci.includes('@') ? move.uci.split('@')[1] : move.uci;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.uci;
  }

  static override getVariantKeys(): VariantKey[] {
    return [VariantKey.gomoku];
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

  // the opening always starts with P1 holding black, whoever is asking
  static override getInitialFen(_playerIndex: PlayerIndex): string {
    return `${this.getInitialBoardFen()} b 1 o 1`;
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

  static override parseLexicalUci(uci: string): LexicalUci | undefined {
    if (!uci || uci === 'swap' || uci === 'swap2') return undefined;
    return super.parseLexicalUci(uci);
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return (super.fromSetup(setup) as Result<GameFamily, PositionError>).map(pos => {
      pos.pockets = undefined;
      pos.stones = new Map(setup.stones);
      pos.blackSeat = setup.blackSeat ?? 'p1';
      pos.openingStep = setup.openingStep ?? '-';
      return pos;
    });
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
        if (!continuesBack && this.runLength(stones, square, role, df, dr) >= 5) return role;
      }
    }
    return undefined;
  }

  // black and white alternate from the first stone, so the counts alone say which colour comes next
  nextColour(): Role {
    return gomokuNextColour(this.stones);
  }

  seatOf(role: Role): PlayerIndex {
    return role === 'b-piece' ? this.blackSeat : opposite(this.blackSeat);
  }

  stoneAt(square: Square): Piece | undefined {
    const role = this.stones.get(square);
    return role && { role, playerIndex: this.seatOf(role) };
  }

  emptyPoints(): Square[] {
    if (this.isVariantEnd()) return [];
    return [...Array(GameFamily.width * GameFamily.height).keys()].filter(square => !this.stones.has(square));
  }

  canSwap(): boolean {
    return !this.isVariantEnd() && (this.openingStep === 'c' || this.openingStep === 'f');
  }

  canSwap2(): boolean {
    return !this.isVariantEnd() && this.openingStep === 'c';
  }

  isBoardFull(): boolean {
    return this.stones.size === GameFamily.width * GameFamily.height;
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
    this.stones.set(move.to, move.role);
    if (this.openingStep === 'o') {
      if (this.stones.size === 3) this.openingStep = 'c';
    } else if (this.openingStep === 's') {
      // the swap2 pair ends with the colours exchanged, exactly as a swap makes
      if (this.stones.size === 5) {
        this.openingStep = 'f';
        this.blackSeat = opposite(this.blackSeat);
      }
    } else {
      this.openingStep = '-';
    }
    this.endAction();
  }

  // the stones keep their colour; each seat takes over the colour the other held
  swap(): void {
    this.blackSeat = opposite(this.blackSeat);
    this.openingStep = '-';
    this.endAction();
  }

  swap2(): void {
    this.openingStep = 's';
    this.endAction();
  }

  private endAction(): void {
    const next = gomokuSeatToMove(this.stones, this.blackSeat, this.openingStep);
    this.halfmoves += 1;
    if (next !== this.turn && next === 'p1') this.fullmoves += 1;
    this.turn = next;
  }

  override toSetup(): Setup {
    return {
      ...super.toSetup(),
      pockets: undefined,
      stones: new Map(this.stones),
      blackSeat: this.blackSeat,
      openingStep: this.openingStep,
    };
  }

  override clone(): GameFamily {
    const pos = super.clone() as GameFamily;
    pos.stones = new Map(this.stones);
    pos.blackSeat = this.blackSeat;
    pos.openingStep = this.openingStep;
    return pos;
  }

  protected override validate(): Result<undefined, PositionError> {
    return Result.ok(undefined);
  }

  override isVariantEnd(): boolean {
    return GameFamily.colourWithLine(this.stones) !== undefined || this.isBoardFull();
  }

  override variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;
    const colour = GameFamily.colourWithLine(this.stones);
    return { winner: colour ? this.seatOf(colour) : undefined };
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
