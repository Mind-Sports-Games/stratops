import { PlayerIndex, ROLES, Square, Move } from './types';
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
  's1-piece': number;
  's2-piece': number;
  's3-piece': number;
  's4-piece': number;
  's5-piece': number;
  's6-piece': number;
  's7-piece': number;
  's8-piece': number;
  's9-piece': number;
  's10-piece': number;
  's11-piece': number;
  's12-piece': number;
  's13-piece': number;
  's14-piece': number;
  's15-piece': number;
  's16-piece': number;
  's17-piece': number;
  's18-piece': number;
  's19-piece': number;
  's20-piece': number;
  's21-piece': number;
  's22-piece': number;
  's23-piece': number;
  's24-piece': number;
  's25-piece': number;
  's26-piece': number;
  's27-piece': number;
  's28-piece': number;
  's29-piece': number;
  's30-piece': number;
  's31-piece': number;
  's32-piece': number;
  's33-piece': number;
  's34-piece': number;
  's35-piece': number;
  's36-piece': number;
  's37-piece': number;
  's38-piece': number;
  's39-piece': number;
  's40-piece': number;
  's41-piece': number;
  's42-piece': number;
  's43-piece': number;
  's44-piece': number;
  's45-piece': number;
  's46-piece': number;
  's47-piece': number;
  's48-piece': number;

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
  northScore?: number;
  southScore?: number;
  lastMove?: Move;
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
    lastMove: undefined,
  };
}
