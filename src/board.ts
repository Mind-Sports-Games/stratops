import { Square, PlayerIndex, Role, Piece, PLAYERINDEXES, ROLES, ByRole, ByPlayerIndex } from './types';
import { SquareSet } from './squareSet';

/**
 * Piece positions on a board.
 *
 * Properties are sets of squares, like `board.occupied` for all occupied
 * squares, `board[playerIndex]` for all pieces of that playerIndex, and `board[role]`
 * for all pieces of that role. When modifying the properties directly, take
 * care to keep them consistent.
 */
export class Board implements Iterable<[Square, Piece]>, ByRole<SquareSet>, ByPlayerIndex<SquareSet> {
  /**
   * All occupied squares.
   */
  occupied: SquareSet;
  /**
   * All squares occupied by pieces known to be promoted. This information is
   * relevant in chess variants like Crazyhouse.
   */
  promoted: SquareSet;

  p1: SquareSet;
  p2: SquareSet;
  'a-piece': SquareSet;
  'b-piece': SquareSet;
  'c-piece': SquareSet;
  'd-piece': SquareSet;
  'e-piece': SquareSet;
  'f-piece': SquareSet;
  'g-piece': SquareSet;
  'h-piece': SquareSet;
  'i-piece': SquareSet;
  'j-piece': SquareSet;
  'k-piece': SquareSet;
  'l-piece': SquareSet;
  'm-piece': SquareSet;
  'n-piece': SquareSet;
  'o-piece': SquareSet;
  'p-piece': SquareSet;
  'q-piece': SquareSet;
  'r-piece': SquareSet;
  's-piece': SquareSet;
  't-piece': SquareSet;
  'u-piece': SquareSet;
  'v-piece': SquareSet;
  'w-piece': SquareSet;
  'x-piece': SquareSet;
  'y-piece': SquareSet;
  'z-piece': SquareSet;
  'pa-piece': SquareSet;
  'pb-piece': SquareSet;
  'pc-piece': SquareSet;
  'pd-piece': SquareSet;
  'pe-piece': SquareSet;
  'pf-piece': SquareSet;
  'pg-piece': SquareSet;
  'ph-piece': SquareSet;
  'pi-piece': SquareSet;
  'pj-piece': SquareSet;
  'pk-piece': SquareSet;
  'pl-piece': SquareSet;
  'pm-piece': SquareSet;
  'pn-piece': SquareSet;
  'po-piece': SquareSet;
  'pp-piece': SquareSet;
  'pq-piece': SquareSet;
  'pr-piece': SquareSet;
  'ps-piece': SquareSet;
  'pt-piece': SquareSet;
  'pu-piece': SquareSet;
  'pv-piece': SquareSet;
  'pw-piece': SquareSet;
  'px-piece': SquareSet;
  'py-piece': SquareSet;
  'pz-piece': SquareSet;
  'A-piece': SquareSet;
  'B-piece': SquareSet;
  'C-piece': SquareSet;
  'D-piece': SquareSet;
  'E-piece': SquareSet;
  'F-piece': SquareSet;
  'G-piece': SquareSet;
  'H-piece': SquareSet;
  'I-piece': SquareSet;
  'J-piece': SquareSet;
  'K-piece': SquareSet;
  'L-piece': SquareSet;
  'M-piece': SquareSet;
  'N-piece': SquareSet;
  'O-piece': SquareSet;
  'P-piece': SquareSet;
  'Q-piece': SquareSet;
  'R-piece': SquareSet;
  'S-piece': SquareSet;
  'T-piece': SquareSet;
  'U-piece': SquareSet;
  'V-piece': SquareSet;
  'W-piece': SquareSet;
  'X-piece': SquareSet;
  'Y-piece': SquareSet;
  'Z-piece': SquareSet;
  'pA-piece': SquareSet;
  'pB-piece': SquareSet;
  'pC-piece': SquareSet;
  'pD-piece': SquareSet;
  'pE-piece': SquareSet;
  'pF-piece': SquareSet;
  'pG-piece': SquareSet;
  'pH-piece': SquareSet;
  'pI-piece': SquareSet;
  'pJ-piece': SquareSet;
  'pK-piece': SquareSet;
  'pL-piece': SquareSet;
  'pM-piece': SquareSet;
  'pN-piece': SquareSet;
  'pO-piece': SquareSet;
  'pP-piece': SquareSet;
  'pQ-piece': SquareSet;
  'pR-piece': SquareSet;
  'pS-piece': SquareSet;
  'pT-piece': SquareSet;
  'pU-piece': SquareSet;
  'pV-piece': SquareSet;
  'pW-piece': SquareSet;
  'pX-piece': SquareSet;
  'pY-piece': SquareSet;
  'pZ-piece': SquareSet;

  private constructor() {}

  static default(): Board {
    const board = new Board();
    board.reset();
    return board;
  }

  static racingKings(): Board {
    const board = new Board();
    board.occupied = new SquareSet(0xffff, 0);
    board.promoted = SquareSet.empty();
    board.p1 = new SquareSet(0xf0f0, 0);
    board.p2 = new SquareSet(0x0f0f, 0);
    board['p-piece'] = SquareSet.empty();
    board['n-piece'] = new SquareSet(0x1818, 0);
    board['b-piece'] = new SquareSet(0x2424, 0);
    board['r-piece'] = new SquareSet(0x4242, 0);
    board['q-piece'] = new SquareSet(0x0081, 0);
    board['k-piece'] = new SquareSet(0x8100, 0);
    board['l-piece'] = new SquareSet(0, 0);
    return board;
  }

  static horde(): Board {
    const board = new Board();
    board.occupied = new SquareSet(0xffff_ffff, 0xffff_0066);
    board.promoted = SquareSet.empty();
    board.p1 = new SquareSet(0xffff_ffff, 0x0000_0066);
    board.p2 = new SquareSet(0, 0xffff_0000);
    board['p-piece'] = new SquareSet(0xffff_ffff, 0x00ff_0066);
    board['n-piece'] = new SquareSet(0, 0x4200_0000);
    board['b-piece'] = new SquareSet(0, 0x2400_0000);
    board['r-piece'] = new SquareSet(0, 0x8100_0000);
    board['q-piece'] = new SquareSet(0, 0x0800_0000);
    board['k-piece'] = new SquareSet(0, 0x1000_0000);
    board['l-piece'] = new SquareSet(0, 0);
    return board;
  }

  static linesOfAction(): Board {
    const board = new Board();
    board.occupied = new SquareSet(0x8181_817e, 0x7e81_8181);
    board.promoted = SquareSet.empty();
    board.p1 = new SquareSet(0x8181_8100, 0x0081_8181);
    board.p2 = new SquareSet(0x007e, 0x7e00_0000);
    board['p-piece'] = new SquareSet(0, 0);
    board['n-piece'] = new SquareSet(0, 0);
    board['b-piece'] = new SquareSet(0, 0);
    board['r-piece'] = new SquareSet(0, 0);
    board['q-piece'] = new SquareSet(0, 0);
    board['k-piece'] = new SquareSet(0, 0);
    board['l-piece'] = board.occupied;
    return board;
  }

  /**
   * Resets all pieces to the default starting position for standard chess.
   */
  reset(): void {
    this.occupied = new SquareSet(0xffff, 0xffff_0000);
    this.promoted = SquareSet.empty();
    this.p1 = new SquareSet(0xffff, 0);
    this.p2 = new SquareSet(0, 0xffff_0000);
    this['p-piece'] = new SquareSet(0xff00, 0x00ff_0000);
    this['n-piece'] = new SquareSet(0x42, 0x4200_0000);
    this['b-piece'] = new SquareSet(0x24, 0x2400_0000);
    this['r-piece'] = new SquareSet(0x81, 0x8100_0000);
    this['q-piece'] = new SquareSet(0x8, 0x0800_0000);
    this['k-piece'] = new SquareSet(0x10, 0x1000_0000);
    this['l-piece'] = new SquareSet(0, 0);
  }

  static empty(): Board {
    const board = new Board();
    board.clear();
    return board;
  }

  clear(): void {
    this.occupied = SquareSet.empty();
    this.promoted = SquareSet.empty();
    for (const playerIndex of PLAYERINDEXES) this[playerIndex] = SquareSet.empty();
    for (const role of ROLES) this[role] = SquareSet.empty();
  }

  clone(): Board {
    const board = new Board();
    board.occupied = this.occupied;
    board.promoted = this.promoted;
    for (const playerIndex of PLAYERINDEXES) board[playerIndex] = this[playerIndex];
    for (const role of ROLES) board[role] = this[role];
    return board;
  }

  equalsIgnorePromoted(other: Board): boolean {
    if (!this.p1.equals(other.p1)) return false;
    return ROLES.every(role => this[role].equals(other[role]));
  }

  equals(other: Board): boolean {
    return this.equalsIgnorePromoted(other) && this.promoted.equals(other.promoted);
  }

  getPlayerIndex(square: Square): PlayerIndex | undefined {
    if (this.p1.has(square)) return 'p1';
    if (this.p2.has(square)) return 'p2';
    return;
  }

  getRole(square: Square): Role | undefined {
    for (const role of ROLES) {
      if (this[role].has(square)) return role;
    }
    return;
  }

  get(square: Square): Piece | undefined {
    const playerIndex = this.getPlayerIndex(square);
    if (!playerIndex) return;
    const role = this.getRole(square)!;
    const promoted = this.promoted.has(square);
    return { playerIndex, role, promoted };
  }

  /**
   * Removes and returns the piece from the given `square`, if any.
   */
  take(square: Square): Piece | undefined {
    const piece = this.get(square);
    if (piece) {
      this.occupied = this.occupied.without(square);
      this[piece.playerIndex] = this[piece.playerIndex].without(square);
      this[piece.role] = this[piece.role].without(square);
      if (piece.promoted) this.promoted = this.promoted.without(square);
    }
    return piece;
  }

  /**
   * Put `piece` onto `square`, potentially replacing an existing piece.
   * Returns the existing piece, if any.
   */
  set(square: Square, piece: Piece): Piece | undefined {
    const old = this.take(square);
    this.occupied = this.occupied.with(square);
    this[piece.playerIndex] = this[piece.playerIndex].with(square);
    this[piece.role] = this[piece.role].with(square);
    if (piece.promoted) this.promoted = this.promoted.with(square);
    return old;
  }

  has(square: Square): boolean {
    return this.occupied.has(square);
  }

  *[Symbol.iterator](): Iterator<[Square, Piece]> {
    for (const square of this.occupied) {
      yield [square, this.get(square)!];
    }
  }

  pieces(playerIndex: PlayerIndex, role: Role): SquareSet {
    return this[playerIndex].intersect(this[role]);
  }

  rooksAndQueens(): SquareSet {
    return this['r-piece'].union(this['q-piece']);
  }

  bishopsAndQueens(): SquareSet {
    return this['b-piece'].union(this['q-piece']);
  }

  /**
   * Finds the unique unpromoted king of the given `playerIndex`, if any.
   */
  kingOf(playerIndex: PlayerIndex): Square | undefined {
    return this['k-piece'].intersect(this[playerIndex]).diff(this.promoted).singleSquare();
  }
}
