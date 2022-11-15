import { PlayerIndex, ROLES, Square } from './types';
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
  'A-piece': number;
  'B-piece': number;
  'C-piece': number;
  'D-piece': number;
  'E-piece': number;
  'F-piece': number;
  'G-piece': number;
  'H-piece': number;
  'I-piece': number;
  'J-piece': number;
  'K-piece': number;
  'L-piece': number;
  'M-piece': number;
  'N-piece': number;
  'O-piece': number;
  'P-piece': number;
  'Q-piece': number;
  'R-piece': number;
  'S-piece': number;
  'T-piece': number;
  'U-piece': number;
  'V-piece': number;
  'W-piece': number;
  'X-piece': number;
  'Y-piece': number;
  'Z-piece': number;
  'pA-piece': number;
  'pB-piece': number;
  'pC-piece': number;
  'pD-piece': number;
  'pE-piece': number;
  'pF-piece': number;
  'pG-piece': number;
  'pH-piece': number;
  'pI-piece': number;
  'pJ-piece': number;
  'pK-piece': number;
  'pL-piece': number;
  'pM-piece': number;
  'pN-piece': number;
  'pO-piece': number;
  'pP-piece': number;
  'pQ-piece': number;
  'pR-piece': number;
  'pS-piece': number;
  'pT-piece': number;
  'pU-piece': number;
  'pV-piece': number;
  'pW-piece': number;
  'pX-piece': number;
  'pY-piece': number;
  'pZ-piece': number;

  private constructor() {}

  static empty(): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = 0;
    return m;
  }

  static fromBoard(board: Board, playerIndex: PlayerIndex): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = board.pieces(playerIndex, role).size();
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
  constructor(public p1: MaterialSide, public p2: MaterialSide) {}

  static empty(): Material {
    return new Material(MaterialSide.empty(), MaterialSide.empty());
  }

  static fromBoard(board: Board): Material {
    return new Material(MaterialSide.fromBoard(board, 'p1'), MaterialSide.fromBoard(board, 'p2'));
  }

  clone(): Material {
    return new Material(this.p1.clone(), this.p2.clone());
  }

  equals(other: Material): boolean {
    return this.p1.equals(other.p1) && this.p2.equals(other.p2);
  }

  add(other: Material): Material {
    return new Material(this.p1.add(other.p1), this.p2.add(other.p2));
  }

  count(): number {
    return this.p1.count() + this.p2.count();
  }

  isEmpty(): boolean {
    return this.p1.isEmpty() && this.p2.isEmpty();
  }

  nonEmpty(): boolean {
    return !this.isEmpty();
  }

  hasPawns(): boolean {
    return this.p1.hasPawns() || this.p2.hasPawns();
  }

  hasNonPawns(): boolean {
    return this.p1.hasNonPawns() || this.p2.hasNonPawns();
  }
}

export class RemainingChecks {
  constructor(public p1: number, public p2: number) {}

  static default(): RemainingChecks {
    return new RemainingChecks(3, 3);
  }

  static fiveCheck(): RemainingChecks {
    return new RemainingChecks(5, 5);
  }

  clone(): RemainingChecks {
    return new RemainingChecks(this.p1, this.p2);
  }

  equals(other: RemainingChecks): boolean {
    return this.p1 === other.p1 && this.p2 === other.p2;
  }
}

export interface Setup {
  board: Board;
  pockets: Material | undefined;
  turn: PlayerIndex;
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
    turn: 'p1',
    unmovedRooks: SquareSet.corners64(),
    epSquare: undefined,
    remainingChecks: undefined,
    halfmoves: 0,
    fullmoves: 1,
  };
}
