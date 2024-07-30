import { Square, PlayerIndex, Role, Rules, Piece, PLAYERINDEXES, ROLES, ByRole, ByPlayerIndex } from './types.js';
import { SquareSet } from './squareSet.js';

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
  's1-piece': SquareSet;
  's2-piece': SquareSet;
  's3-piece': SquareSet;
  's4-piece': SquareSet;
  's5-piece': SquareSet;
  's6-piece': SquareSet;
  's7-piece': SquareSet;
  's8-piece': SquareSet;
  's9-piece': SquareSet;
  's10-piece': SquareSet;
  's11-piece': SquareSet;
  's12-piece': SquareSet;
  's13-piece': SquareSet;
  's14-piece': SquareSet;
  's15-piece': SquareSet;
  's16-piece': SquareSet;
  's17-piece': SquareSet;
  's18-piece': SquareSet;
  's19-piece': SquareSet;
  's20-piece': SquareSet;
  's21-piece': SquareSet;
  's22-piece': SquareSet;
  's23-piece': SquareSet;
  's24-piece': SquareSet;
  's25-piece': SquareSet;
  's26-piece': SquareSet;
  's27-piece': SquareSet;
  's28-piece': SquareSet;
  's29-piece': SquareSet;
  's30-piece': SquareSet;
  's31-piece': SquareSet;
  's32-piece': SquareSet;
  's33-piece': SquareSet;
  's34-piece': SquareSet;
  's35-piece': SquareSet;
  's36-piece': SquareSet;
  's37-piece': SquareSet;
  's38-piece': SquareSet;
  's39-piece': SquareSet;
  's40-piece': SquareSet;
  's41-piece': SquareSet;
  's42-piece': SquareSet;
  's43-piece': SquareSet;
  's44-piece': SquareSet;
  's45-piece': SquareSet;
  's46-piece': SquareSet;
  's47-piece': SquareSet;
  's48-piece': SquareSet;

  protected constructor(public rules: Rules) {}

  static default(): Board {
    const board = new Board('chess');
    board.reset();
    return board;
  }

  static racingKings(): Board {
    const board = new Board('racingkings');
    board.reset();
    board.occupied = new SquareSet([0xffff, 0, 0, 0]);
    board.promoted = SquareSet.empty();
    board.p1 = new SquareSet([0xf0f0, 0, 0, 0]);
    board.p2 = new SquareSet([0x0f0f, 0, 0, 0]);
    board['p-piece'] = SquareSet.empty();
    board['n-piece'] = new SquareSet([0x1818, 0, 0, 0]);
    board['b-piece'] = new SquareSet([0x2424, 0, 0, 0]);
    board['r-piece'] = new SquareSet([0x4242, 0, 0, 0]);
    board['q-piece'] = new SquareSet([0x0081, 0, 0, 0]);
    board['k-piece'] = new SquareSet([0x8100, 0, 0, 0]);
    board['l-piece'] = SquareSet.empty();
    return board;
  }

  static horde(): Board {
    const board = new Board('horde');
    board.reset();
    board.occupied = new SquareSet([0xffff_ffff, 0xffff_0066, 0, 0]);
    board.promoted = SquareSet.empty();
    board.p1 = new SquareSet([0xffff_ffff, 0x0000_0066, 0, 0]);
    board.p2 = new SquareSet([0, 0xffff_0000, 0, 0]);
    board['p-piece'] = new SquareSet([0xffff_ffff, 0x00ff_0066, 0, 0]);
    board['n-piece'] = new SquareSet([0, 0x4200_0000, 0, 0]);
    board['b-piece'] = new SquareSet([0, 0x2400_0000, 0, 0]);
    board['r-piece'] = new SquareSet([0, 0x8100_0000, 0, 0]);
    board['q-piece'] = new SquareSet([0, 0x0800_0000, 0, 0]);
    board['k-piece'] = new SquareSet([0, 0x1000_0000, 0, 0]);
    board['l-piece'] = SquareSet.empty();
    return board;
  }

  static shogi(): Board {
    // TODO: this is not the starting position, fix it.
    const board = new Board('shogi');
    board.reset();
    board.occupied = new SquareSet([0xffff_ffff, 0xffff_0066, 0, 0]);
    board.promoted = SquareSet.empty();
    board.p1 = new SquareSet([0xffff_ffff, 0x0000_0066, 0, 0]);
    board.p2 = new SquareSet([0, 0xffff_0000, 0, 0]);
    board['p-piece'] = new SquareSet([0xffff_ffff, 0x00ff_0066, 0, 0]);
    board['n-piece'] = new SquareSet([0, 0x4200_0000, 0, 0]);
    board['b-piece'] = new SquareSet([0, 0x2400_0000, 0, 0]);
    board['r-piece'] = new SquareSet([0, 0x8100_0000, 0, 0]);
    board['s-piece'] = new SquareSet([0, 0, 0, 0]);
    board['q-piece'] = new SquareSet([0, 0x0800_0000, 0, 0]);
    board['k-piece'] = new SquareSet([0, 0x1000_0000, 0, 0]);
    board['l-piece'] = SquareSet.empty();
    board['g-piece'] = SquareSet.empty();
    board['pp-piece'] = SquareSet.empty();
    board['pl-piece'] = SquareSet.empty();
    board['pn-piece'] = SquareSet.empty();
    board['ps-piece'] = SquareSet.empty();
    board['pb-piece'] = SquareSet.empty();
    board['pr-piece'] = SquareSet.empty();
    return board;
  }

  static monster(): Board {
    const board = new Board('monster');
    board.reset();
    board.occupied = new SquareSet([0x3c10, 0xffff_0000, 0, 0]);
    board.promoted = SquareSet.empty();
    board.p1 = new SquareSet([0x3c10, 0, 0, 0]);
    board.p2 = new SquareSet([0, 0xffff_0000, 0, 0]);
    board['p-piece'] = new SquareSet([0x3c00, 0x00ff_0000, 0, 0]);
    board['n-piece'] = new SquareSet([0, 0x4200_0000, 0, 0]);
    board['b-piece'] = new SquareSet([0, 0x2400_0000, 0, 0]);
    board['r-piece'] = new SquareSet([0, 0x8100_0000, 0, 0]);
    board['q-piece'] = new SquareSet([0, 0x0800_0000, 0, 0]);
    board['k-piece'] = new SquareSet([0x10, 0x1000_0000, 0, 0]);
    board['l-piece'] = new SquareSet([0, 0, 0, 0]);
    return board;
  }

  static linesOfAction(): Board {
    const board = new Board('linesofaction');
    board.reset();
    board.occupied = new SquareSet([0x8181_817e, 0x7e81_8181, 0, 0]);
    board.promoted = SquareSet.empty();
    board.p1 = new SquareSet([0x8181_8100, 0x0081_8181, 0, 0]);
    board.p2 = new SquareSet([0x007e, 0x7e00_0000, 0, 0]);
    board['p-piece'] = new SquareSet([0, 0, 0, 0]);
    board['n-piece'] = new SquareSet([0, 0, 0, 0]);
    board['b-piece'] = new SquareSet([0, 0, 0, 0]);
    board['r-piece'] = new SquareSet([0, 0, 0, 0]);
    board['q-piece'] = new SquareSet([0, 0, 0, 0]);
    board['k-piece'] = new SquareSet([0, 0, 0, 0]);
    board['l-piece'] = board.occupied;
    return board;
  }

  /**
   * Resets all pieces to the default starting position for standard chess.
   */
  reset(): void {
    for (const role of ROLES) this[role] = SquareSet.empty();
    this.occupied = new SquareSet([0xffff, 0xffff_0000, 0, 0]);
    this.promoted = SquareSet.empty();
    this.p1 = new SquareSet([0xffff, 0, 0, 0]);
    this.p2 = new SquareSet([0, 0xffff_0000, 0, 0]);
    this['p-piece'] = new SquareSet([0xff00, 0x00ff_0000, 0, 0]);
    this['n-piece'] = new SquareSet([0x42, 0x4200_0000, 0, 0]);
    this['b-piece'] = new SquareSet([0x24, 0x2400_0000, 0, 0]);
    this['r-piece'] = new SquareSet([0x81, 0x8100_0000, 0, 0]);
    this['q-piece'] = new SquareSet([0x8, 0x0800_0000, 0, 0]);
    this['k-piece'] = new SquareSet([0x10, 0x1000_0000, 0, 0]);
    this['l-piece'] = new SquareSet([0, 0, 0, 0]);
  }

  /**
   * Resets all pieces to the default starting position for shogi
   * TODO: this is not the starting position, fix it.
   */
  resetShogi(): void {
    for (const role of ROLES) this[role] = SquareSet.empty();
    this.occupied = SquareSet.empty();
    this.promoted = SquareSet.empty();
    this.p1 = SquareSet.empty();
    this.p2 = SquareSet.empty();
    this['p-piece'] = SquareSet.empty();
    this['n-piece'] = SquareSet.empty();
    this['b-piece'] = SquareSet.empty();
    this['r-piece'] = SquareSet.empty();
    this['q-piece'] = SquareSet.empty();
    this['k-piece'] = SquareSet.empty();
    this['l-piece'] = SquareSet.empty();
    this['l-piece'] = SquareSet.empty();
    this['g-piece'] = SquareSet.empty();
    this['pp-piece'] = SquareSet.empty();
    this['pl-piece'] = SquareSet.empty();
    this['pn-piece'] = SquareSet.empty();
    this['ps-piece'] = SquareSet.empty();
    this['pb-piece'] = SquareSet.empty();
    this['pr-piece'] = SquareSet.empty();
  }

  static empty(rules: Rules): Board {
    const board = new Board(rules);
    if (rules === 'shogi') {
      board.resetShogi();
    } else {
      board.reset();
    }
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
    const board = new Board(this.rules);
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
    return this['k-piece'].intersect(this[playerIndex]).diff64(this.promoted).singleSquare();
  }
}

export class BoardNxN extends Board {}
