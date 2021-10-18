import { Color, ROLES, Square } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';

export class MaterialSide {
  'a-piece': number;
  'b-piece': number;
  'c-piece': number;
  'd-piece': number;
  'e-piece': number;
  'f-piece': number;
  'g-piece': number;
  'h-piece': number;
  'i-piece': number;
  'j-piece': number;
  'k-piece': number;
  'l-piece': number;
  'm-piece': number;
  'n-piece': number;
  'o-piece': number;
  'p-piece': number;
  'q-piece': number;
  'r-piece': number;
  's-piece': number;
  't-piece': number;
  'u-piece': number;
  'v-piece': number;
  'w-piece': number;
  'x-piece': number;
  'y-piece': number;
  'z-piece': number;
  'pa-piece': number;
  'pb-piece': number;
  'pc-piece': number;
  'pd-piece': number;
  'pe-piece': number;
  'pf-piece': number;
  'pg-piece': number;
  'ph-piece': number;
  'pi-piece': number;
  'pj-piece': number;
  'pk-piece': number;
  'pl-piece': number;
  'pm-piece': number;
  'pn-piece': number;
  'po-piece': number;
  'pp-piece': number;
  'pq-piece': number;
  'pr-piece': number;
  'ps-piece': number;
  'pt-piece': number;
  'pu-piece': number;
  'pv-piece': number;
  'pw-piece': number;
  'px-piece': number;
  'py-piece': number;
  'pz-piece': number;

  private constructor() {}

  static empty(): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = 0;
    return m;
  }

  static fromBoard(board: Board, color: Color): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = board.pieces(color, role).size();
    return m;
  }

  clone(): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = this[role];
    return m;
  }

  equals(other: MaterialSide): boolean {
    return ROLES.every(role => this[role] === other[role]);
  }

  add(other: MaterialSide): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = this[role] + other[role];
    return m;
  }

  nonEmpty(): boolean {
    return ROLES.some(role => this[role] > 0);
  }

  isEmpty(): boolean {
    return !this.nonEmpty();
  }

  hasPawns(): boolean {
    return this['p-piece'] > 0;
  }

  hasNonPawns(): boolean {
    // TODO: I don't know if we should be editing this.
    return (
      this['n-piece'] > 0 ||
      this['b-piece'] > 0 ||
      this['r-piece'] > 0 ||
      this['q-piece'] > 0 ||
      this['k-piece'] > 0 ||
      this['l-piece'] > 0
    );
  }

  count(): number {
    return (
      this['p-piece'] +
      this['n-piece'] +
      this['b-piece'] +
      this['r-piece'] +
      this['q-piece'] +
      this['k-piece'] +
      this['l-piece']
    );
  }
}

export class Material {
  constructor(public white: MaterialSide, public black: MaterialSide) {}

  static empty(): Material {
    return new Material(MaterialSide.empty(), MaterialSide.empty());
  }

  static fromBoard(board: Board): Material {
    return new Material(MaterialSide.fromBoard(board, 'white'), MaterialSide.fromBoard(board, 'black'));
  }

  clone(): Material {
    return new Material(this.white.clone(), this.black.clone());
  }

  equals(other: Material): boolean {
    return this.white.equals(other.white) && this.black.equals(other.black);
  }

  add(other: Material): Material {
    return new Material(this.white.add(other.white), this.black.add(other.black));
  }

  count(): number {
    return this.white.count() + this.black.count();
  }

  isEmpty(): boolean {
    return this.white.isEmpty() && this.black.isEmpty();
  }

  nonEmpty(): boolean {
    return !this.isEmpty();
  }

  hasPawns(): boolean {
    return this.white.hasPawns() || this.black.hasPawns();
  }

  hasNonPawns(): boolean {
    return this.white.hasNonPawns() || this.black.hasNonPawns();
  }
}

export class RemainingChecks {
  constructor(public white: number, public black: number) {}

  static default(): RemainingChecks {
    return new RemainingChecks(3, 3);
  }

  clone(): RemainingChecks {
    return new RemainingChecks(this.white, this.black);
  }

  equals(other: RemainingChecks): boolean {
    return this.white === other.white && this.black === other.black;
  }
}

export interface Setup {
  board: Board;
  pockets: Material | undefined;
  turn: Color;
  unmovedRooks: SquareSet;
  epSquare: Square | undefined;
  remainingChecks: RemainingChecks | undefined;
  halfmoves: number;
  fullmoves: number;
}

export function defaultSetup(): Setup {
  return {
    board: Board.default(),
    pockets: undefined,
    turn: 'white',
    unmovedRooks: SquareSet.corners(),
    epSquare: undefined,
    remainingChecks: undefined,
    halfmoves: 0,
    fullmoves: 1,
  };
}
