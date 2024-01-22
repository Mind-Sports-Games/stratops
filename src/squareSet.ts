import { Tuple, Square, PlayerIndex } from './types';

function popcnt32(n: number): number {
  n = n - ((n >>> 1) & 0x5555_5555);
  n = (n & 0x3333_3333) + ((n >>> 2) & 0x3333_3333);
  return Math.imul((n + (n >>> 4)) & 0x0f0f_0f0f, 0x0101_0101) >> 24;
}

function bswap32(n: number): number {
  n = ((n >>> 8) & 0x00ff_00ff) | ((n & 0x00ff_00ff) << 8);
  return ((n >>> 16) & 0xffff) | ((n & 0xffff) << 16);
}

function rbit32(n: number): number {
  n = ((n >>> 1) & 0x5555_5555) | ((n & 0x5555_5555) << 1);
  n = ((n >>> 2) & 0x3333_3333) | ((n & 0x3333_3333) << 2);
  n = ((n >>> 4) & 0x0f0f_0f0f) | ((n & 0x0f0f_0f0f) << 4);
  return bswap32(n);
}

// The instance interface for SquareSets
enum BitPartTarget {
  Gte128 = 1,
  Gte96,
  Gte64,
  Gte32,
  Gt0,
  Default,
}

type BitPartTargetHandler<R> = {
  [BitPartTarget.Gte128]: (x: number) => R;
  [BitPartTarget.Gte96]: (x: number) => R;
  [BitPartTarget.Gte64]: (x: number) => R;
  [BitPartTarget.Gte32]: (x: number) => R;
  [BitPartTarget.Gt0]: (x: number) => R;
  [BitPartTarget.Default]: () => R;
};

const bitPartMap =
  (shift: number) =>
  <R>(handlers: BitPartTargetHandler<R>) => {
    if (shift >= 128) {
      return handlers[BitPartTarget.Gte128](shift);
    } else if (shift >= 96) {
      return handlers[BitPartTarget.Gte96](shift);
    } else if (shift >= 64) {
      return handlers[BitPartTarget.Gte64](shift);
    } else if (shift >= 32) {
      return handlers[BitPartTarget.Gte32](shift);
    } else if (shift > 0) {
      return handlers[BitPartTarget.Gt0](shift);
    } else {
      return handlers[BitPartTarget.Default]();
    }
  };

type CopyParams = {
  [0]?: (x: number) => number;
  [1]?: (x: number) => number;
  [2]?: (x: number) => number;
  [3]?: (x: number) => number;
};

// 64 bit square sets are efficient to implement, due to their alignment
// with 8-bit bytes, and 32-bit numbers.
export class SquareSet implements Iterable<Square> {
  // bitParts is stored as lowest, low, high, highest
  constructor(public bitParts: Tuple<number, 4>) {}

  static fromSquare(square: Square): SquareSet {
    return bitPartMap(square)({
      [BitPartTarget.Gte128]: (_: number) => new SquareSet([0, 0, 0, 0]),
      [BitPartTarget.Gte96]: (square: number) => new SquareSet([0, 0, 0, 1 << (square - 96)]),
      [BitPartTarget.Gte64]: (square: number) => new SquareSet([0, 0, 1 << (square - 64), 0]),
      [BitPartTarget.Gte32]: (square: number) => new SquareSet([0, 1 << (square - 32), 0, 0]),
      [BitPartTarget.Gt0]: (square: number) => new SquareSet([1 << square, 0, 0, 0]),
      [BitPartTarget.Default]: () => new SquareSet([1, 0, 0, 0]),
    });
  }

  static empty(): SquareSet {
    return new SquareSet([0, 0, 0, 0]);
  }

  static full64(): SquareSet {
    return new SquareSet([0xffff_ffff, 0xffff_ffff, 0, 0]);
  }

  static fromRank64(rank: number): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0xff, 0, 0, 0]).shl64(8 * rank);
  }

  static fromFile64(file: number): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0x0101_0101 << file, 0x0101_0101 << file, 0, 0]);
  }

  static corners64(): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0x81, 0x8100_0000, 0, 0]);
  }

  static center64(): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0x1800_0000, 0x18, 0, 0]);
  }

  static backranks64(): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0xff, 0xff00_0000, 0, 0]);
  }

  static backrank64(playerIndex: PlayerIndex): SquareSet {
    // TODO: this is only correct for chess for now
    return playerIndex === 'p1' ? new SquareSet([0xff, 0, 0, 0]) : new SquareSet([0, 0xff00_0000, 0, 0]);
  }

  static lightSquares64(): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0x55aa_55aa, 0x55aa_55aa, 0, 0]);
  }

  static darkSquares64(): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0xaa55_aa55, 0xaa55_aa55, 0, 0]);
  }

  private copy(f: CopyParams): SquareSet {
    return new SquareSet([
      f[0] ? f[0](this.bitParts[0]) : this.bitParts[0],
      f[1] ? f[1](this.bitParts[1]) : this.bitParts[1],
      f[2] ? f[2](this.bitParts[2]) : this.bitParts[2],
      f[3] ? f[3](this.bitParts[3]) : this.bitParts[3],
    ]);
  }

  complement(): SquareSet {
    return new SquareSet([~this.bitParts[0], ~this.bitParts[1], ~this.bitParts[2], ~this.bitParts[3]]);
  }

  xor(other: SquareSet): SquareSet {
    return new SquareSet([
      this.bitParts[0] ^ other.bitParts[0],
      this.bitParts[1] ^ other.bitParts[1],
      this.bitParts[2] ^ other.bitParts[2],
      this.bitParts[3] ^ other.bitParts[3],
    ]);
  }

  union(other: SquareSet): SquareSet {
    return new SquareSet([
      this.bitParts[0] | other.bitParts[0],
      this.bitParts[1] | other.bitParts[1],
      this.bitParts[2] | other.bitParts[2],
      this.bitParts[3] | other.bitParts[3],
    ]);
  }

  intersect(other: SquareSet): SquareSet {
    return new SquareSet([
      this.bitParts[0] & other.bitParts[0],
      this.bitParts[1] & other.bitParts[1],
      this.bitParts[2] & other.bitParts[2],
      this.bitParts[3] & other.bitParts[3],
    ]);
  }

  diff(other: SquareSet): SquareSet {
    return new SquareSet([
      this.bitParts[0] & ~other.bitParts[0],
      this.bitParts[1] & ~other.bitParts[1],
      this.bitParts[2] & ~other.bitParts[2],
      this.bitParts[3] & ~other.bitParts[3],
    ]);
  }

  diff64(other: SquareSet): SquareSet {
    return new SquareSet([this.bitParts[0] & ~other.bitParts[0], this.bitParts[1] & ~other.bitParts[1], 0, 0]);
  }

  intersects(other: SquareSet): boolean {
    return this.intersect(other).nonEmpty();
  }

  isDisjoint(other: SquareSet): boolean {
    return this.intersect(other).isEmpty();
  }

  supersetOf64(other: SquareSet): boolean {
    return other.diff64(this).isEmpty();
  }

  subsetOf64(other: SquareSet): boolean {
    return this.diff64(other).isEmpty();
  }

  shr64(shift: number): SquareSet {
    if (shift >= 64) return SquareSet.empty();
    if (shift >= 32) return new SquareSet([this.bitParts[1] >>> (shift - 32), 0, 0, 0]);
    if (shift > 0)
      return new SquareSet([
        (this.bitParts[0] >>> shift) ^ (this.bitParts[1] << (32 - shift)),
        this.bitParts[1] >>> shift,
        0,
        0,
      ]);
    return this;
  }

  shr128(shift: number): SquareSet {
    return bitPartMap(shift)({
      [BitPartTarget.Gte128]: (_: number) => SquareSet.empty(),
      [BitPartTarget.Gte96]: (shift: number) => {
        const partialShift = shift - 96;
        return new SquareSet([this.bitParts[3] >>> partialShift, 0, 0, 0]);
      },
      [BitPartTarget.Gte64]: (shift: number) => {
        const partialShift = shift - 64;
        return new SquareSet([
          (this.bitParts[2] >>> partialShift) ^ (this.bitParts[3] << (32 - partialShift)),
          this.bitParts[3] >>> partialShift,
          0,
          0,
        ]);
      },
      [BitPartTarget.Gte32]: (shift: number) => {
        const partialShift = shift - 32;
        return new SquareSet([
          (this.bitParts[1] >>> partialShift) ^ (this.bitParts[2] << (32 - partialShift)),
          (this.bitParts[2] >>> partialShift) ^ (this.bitParts[3] << (32 - partialShift)),
          this.bitParts[3] >>> partialShift,
          0,
        ]);
      },
      [BitPartTarget.Gt0]: (shift: number) => {
        bbpp128('this', this);
        return new SquareSet([
          (this.bitParts[0] >>> shift) ^ (this.bitParts[1] << (32 - shift)),
          (this.bitParts[1] >>> shift) ^ (this.bitParts[2] << (32 - shift)),
          (this.bitParts[2] >>> shift) ^ (this.bitParts[3] << (32 - shift)),
          this.bitParts[3] >>> shift,
        ]);
      },
      [BitPartTarget.Default]: () => this,
    });
  }

  shl64(shift: number): SquareSet {
    // NOTE: theoretically, this shift and the above should be the same,
    //       except that because we'll end up storing some extra bits in the high/low part
    //       then shifting right immediately afterwards might get a different answer
    //       than you'd expect with a 64 bit shift.
    if (shift >= 64) return SquareSet.empty();
    if (shift >= 32) return new SquareSet([0, this.bitParts[0] << (shift - 32), 0, 0]);
    if (shift > 0)
      return new SquareSet([
        this.bitParts[0] << shift,
        (this.bitParts[1] << shift) ^ (this.bitParts[0] >>> (32 - shift)),
        0,
        0,
      ]);
    return this;
  }

  shl128(shift: number): SquareSet {
    return bitPartMap(shift)({
      [BitPartTarget.Gte128]: (_: number) => SquareSet.empty(),
      [BitPartTarget.Gte96]: (shift: number) => {
        const partialShift = shift - 96;
        return new SquareSet([0, 0, 0, this.bitParts[0] << partialShift]);
      },
      [BitPartTarget.Gte64]: (shift: number) => {
        const partialShift = shift - 64;
        return new SquareSet([
          0,
          0,
          this.bitParts[0] << partialShift,
          (this.bitParts[1] << partialShift) ^ (this.bitParts[0] >>> (32 - partialShift)),
        ]);
      },
      [BitPartTarget.Gte32]: (shift: number) => {
        const partialShift = shift - 32;
        return new SquareSet([
          0,
          this.bitParts[0] << partialShift,
          (this.bitParts[1] << partialShift) ^ (this.bitParts[0] >>> (32 - partialShift)),
          (this.bitParts[2] << partialShift) ^ (this.bitParts[1] >>> (32 - partialShift)),
        ]);
      },
      [BitPartTarget.Gt0]: (shift: number) => {
        return new SquareSet([
          this.bitParts[0] << shift,
          (this.bitParts[1] << shift) ^ (this.bitParts[0] >>> (32 - shift)),
          (this.bitParts[2] << shift) ^ (this.bitParts[1] >>> (32 - shift)),
          (this.bitParts[3] << shift) ^ (this.bitParts[2] >>> (32 - shift)),
        ]);
      },
      [BitPartTarget.Default]: () => this,
    });
  }

  bswap128(): SquareSet {
    return new SquareSet([
      bswap32(this.bitParts[3]),
      bswap32(this.bitParts[2]),
      bswap32(this.bitParts[1]),
      bswap32(this.bitParts[0]),
    ]);
  }

  bswap64(): SquareSet {
    return new SquareSet([bswap32(this.bitParts[1]), bswap32(this.bitParts[0]), 0, 0]);
  }

  rbit128(): SquareSet {
    return new SquareSet([
      rbit32(this.bitParts[3]),
      rbit32(this.bitParts[2]),
      rbit32(this.bitParts[1]),
      rbit32(this.bitParts[0]),
    ]);
  }

  rbit64(): SquareSet {
    return new SquareSet([rbit32(this.bitParts[1]), rbit32(this.bitParts[0]), 0, 0]);
  }

  // This is only used in attacks, which is only used for chess
  // TODO: port this to other numbers, it only works for the 64 bit chess representation.
  minus64(other: SquareSet): SquareSet {
    const lo = this.bitParts[0] - other.bitParts[0];
    const c = ((lo & other.bitParts[0] & 1) + (other.bitParts[0] >>> 1) + (lo >>> 1)) >>> 31;
    return new SquareSet([lo, this.bitParts[1] - (other.bitParts[1] + c), 0, 0]);
  }

  equals(other: SquareSet): boolean {
    return (
      this.bitParts[0] === other.bitParts[0] &&
      this.bitParts[1] === other.bitParts[1] &&
      this.bitParts[2] === other.bitParts[2] &&
      this.bitParts[3] === other.bitParts[3]
    );
  }

  size(): number {
    return (
      popcnt32(this.bitParts[0]) + popcnt32(this.bitParts[1]) + popcnt32(this.bitParts[2]) + popcnt32(this.bitParts[3])
    );
  }

  isEmpty(): boolean {
    return this.bitParts[0] === 0 && this.bitParts[1] === 0 && this.bitParts[2] === 0 && this.bitParts[3] === 0;
  }

  nonEmpty(): boolean {
    return this.bitParts[0] !== 0 || this.bitParts[1] !== 0 || this.bitParts[2] !== 0 || this.bitParts[3] !== 0;
  }

  has(square: Square): boolean {
    //console.log(`square: ${square}`);
    return (
      0 !==
      bitPartMap(square)({
        [BitPartTarget.Gte128]: (_: number) => 0,
        [BitPartTarget.Gte96]: (square: number) => this.bitParts[3] & (1 << (square - 96)),
        [BitPartTarget.Gte64]: (square: number) => this.bitParts[2] & (1 << (square - 64)),
        [BitPartTarget.Gte32]: (square: number) => this.bitParts[1] & (1 << (square - 32)),
        [BitPartTarget.Gt0]: (square: number) => this.bitParts[0] & (1 << square),
        [BitPartTarget.Default]: () => this.bitParts[0] & 1,
      })
    );
  }

  set(square: Square, on: boolean): SquareSet {
    return on ? this.with(square) : this.without(square);
  }

  with(square: Square): SquareSet {
    return bitPartMap(square)({
      [BitPartTarget.Gte128]: (_: number) => new SquareSet(this.bitParts),
      [BitPartTarget.Gte96]: (square: number) => this.copy({ 3: v => v | (1 << (square - 96)) }),
      [BitPartTarget.Gte64]: (square: number) => this.copy({ 2: v => v | (1 << (square - 64)) }),
      [BitPartTarget.Gte32]: (square: number) => this.copy({ 1: v => v | (1 << (square - 32)) }),
      [BitPartTarget.Gt0]: (square: number) => this.copy({ 0: v => v | (1 << square) }),
      [BitPartTarget.Default]: () => this.copy({ 0: v => v | 1 }),
    });
  }

  without(square: Square): SquareSet {
    return bitPartMap(square)({
      [BitPartTarget.Gte128]: (_: number) => new SquareSet(this.bitParts),
      [BitPartTarget.Gte96]: (square: number) => this.copy({ 3: v => v & ~(1 << (square - 96)) }),
      [BitPartTarget.Gte64]: (square: number) => this.copy({ 2: v => v & ~(1 << (square - 64)) }),
      [BitPartTarget.Gte32]: (square: number) => this.copy({ 1: v => v & ~(1 << (square - 32)) }),
      [BitPartTarget.Gt0]: (square: number) => this.copy({ 0: v => v & ~(1 << square) }),
      [BitPartTarget.Default]: () => this.copy({ 0: v => v & ~1 }),
    });
  }

  toggle(square: Square): SquareSet {
    return bitPartMap(square)({
      [BitPartTarget.Gte128]: (_: number) => new SquareSet(this.bitParts),
      [BitPartTarget.Gte96]: (square: number) => this.copy({ 3: v => v ^ (1 << (square - 96)) }),
      [BitPartTarget.Gte64]: (square: number) => this.copy({ 2: v => v ^ (1 << (square - 64)) }),
      [BitPartTarget.Gte32]: (square: number) => this.copy({ 1: v => v ^ (1 << (square - 32)) }),
      [BitPartTarget.Gt0]: (square: number) => this.copy({ 0: v => v ^ (1 << square) }),
      [BitPartTarget.Default]: () => this.copy({ 0: v => v ^ 1 }),
    });
  }

  last(): Square | undefined {
    if (this.bitParts[3] !== 0) return 127 - Math.clz32(this.bitParts[3]);
    if (this.bitParts[2] !== 0) return 95 - Math.clz32(this.bitParts[2]);
    if (this.bitParts[1] !== 0) return 63 - Math.clz32(this.bitParts[1]);
    if (this.bitParts[0] !== 0) return 31 - Math.clz32(this.bitParts[0]);
    return;
  }

  first(): Square | undefined {
    if (this.bitParts[0] !== 0) return 31 - Math.clz32(this.bitParts[0] & -this.bitParts[0]);
    if (this.bitParts[1] !== 0) return 63 - Math.clz32(this.bitParts[1] & -this.bitParts[1]);
    if (this.bitParts[2] !== 0) return 95 - Math.clz32(this.bitParts[2] & -this.bitParts[2]);
    if (this.bitParts[3] !== 0) return 127 - Math.clz32(this.bitParts[3] & -this.bitParts[3]);
    return;
  }

  withoutFirst(): SquareSet {
    if (this.bitParts[0] !== 0) return this.copy({ 0: v => v & (v - 1) });
    if (this.bitParts[1] !== 1) return this.copy({ 1: v => v & (v - 1) });
    if (this.bitParts[2] !== 2) return this.copy({ 2: v => v & (v - 1) });
    return this.copy({ 3: v => v & (v - 1) });
  }

  moreThanOne(): boolean {
    // TODO: There is probably a more efficient way to do this, but
    // because we now have more combinations than we had before I went
    // for readability rather than efficiency.
    const count = [0, 1, 2, 3].map<number>(i => (this.bitParts[i] !== 0 ? 1 : 0)).reduce((x, y) => x + y);
    return (
      count > 1 ||
      (this.bitParts[0] & (this.bitParts[0] - 1)) !== 0 ||
      (this.bitParts[1] & (this.bitParts[1] - 1)) !== 0 ||
      (this.bitParts[2] & (this.bitParts[2] - 1)) !== 0 ||
      (this.bitParts[3] & (this.bitParts[3] - 1)) !== 0
    );
  }

  singleSquare(): Square | undefined {
    return this.moreThanOne() ? undefined : this.last();
  }

  isSingleSquare(): boolean {
    return this.nonEmpty() && !this.moreThanOne();
  }

  *[Symbol.iterator](): IterableIterator<Square> {
    // TODO: this should be refactored into a nested loop.
    let b0 = this.bitParts[0];
    let b1 = this.bitParts[1];
    let b2 = this.bitParts[2];
    let b3 = this.bitParts[3];
    while (b0 !== 0) {
      const idx = 31 - Math.clz32(b0 & -b0);
      b0 ^= 1 << idx;
      yield idx;
    }
    while (b1 !== 0) {
      const idx = 31 - Math.clz32(b1 & -b1);
      b1 ^= 1 << idx;
      yield 32 + idx;
    }
    while (b2 !== 0) {
      const idx = 31 - Math.clz32(b2 & -b2);
      b2 ^= 1 << idx;
      yield 64 + idx;
    }
    while (b3 !== 0) {
      const idx = 31 - Math.clz32(b3 & -b3);
      b3 ^= 1 << idx;
      yield 96 + idx;
    }
  }

  *reversed(): IterableIterator<Square> {
    // TODO: this should be refactored into a nested loop.
    let b0 = this.bitParts[0];
    let b1 = this.bitParts[1];
    let b2 = this.bitParts[2];
    let b3 = this.bitParts[3];
    while (b3 !== 0) {
      const idx = 31 - Math.clz32(b3);
      b3 ^= 1 << idx;
      yield 96 + idx;
    }
    while (b2 !== 0) {
      const idx = 31 - Math.clz32(b2);
      b2 ^= 1 << idx;
      yield 64 + idx;
    }
    while (b1 !== 0) {
      const idx = 31 - Math.clz32(b1);
      b1 ^= 1 << idx;
      yield 32 + idx;
    }
    while (b0 !== 0) {
      const idx = 31 - Math.clz32(b0);
      b0 ^= 1 << idx;
      yield idx;
    }
  }
}

export const bbpp = (name: string, ss: SquareSet): SquareSet => {
  console.log(`${name}: lo: ${ss.bitParts[0]} hi: ${ss.bitParts[1]}`);
  return ss;
};

export const bbpp128 = (name: string, ss: SquareSet): SquareSet => {
  console.log(`${name}: 0: ${ss.bitParts[0]} 1: ${ss.bitParts[1]} 2: ${ss.bitParts[2]} 3: ${ss.bitParts[3]}`);
  return ss;
};

export const pp = <T>(name: string, t: T): T => {
  console.log(`${name}: ${t}`);
  return t;
};
