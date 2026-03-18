import type { PlayerIndex, Square, Tuple } from './types.js';

// Note:
// In this file, functions and methods with `32` or `64` in their name (e.g., `bswap32`, `shl64`, `diff64`)
// are specialized for 32-bit or 64-bit boards and are supposed to work correctly for those sizes specifically.
// Functions with `WH` in their name (e.g., `padWH`, `unionWH`, `diffWH`) are generic and work for any board width and height.
// Functions with `Square` in their name (e.g., `padSquare`, `fullSquare`) are intended for square boards of size N×N.
// These functions are supposed to be integrated to the generic Variant file and be overriden based on the game when needed (so the "WH" or "Size" part would be removed).

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

const bitPartMap = (shift: number) => <R>(handlers: BitPartTargetHandler<R>) => {
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
      [BitPartTarget.Gte128]: (_: number) => new SquareSet([0, 0, 0, 0]), // no squares
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
  static fullSquare(size: number): SquareSet {
    return new SquareSet([0xffff_ffff, 0xffff_ffff, 0xffff_ffff, 0xffff_ffff])
      .padSquare(size);
  }
  static fullWH(width: number, height: number): SquareSet {
    return new SquareSet([0xffff_ffff, 0xffff_ffff, 0xffff_ffff, 0xffff_ffff])
      .padWH(width, height);
  }

  static fromRank64(rank: number): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0xff, 0, 0, 0]).shl64(8 * rank);
  }
  static fromRankWH(rank: number, width: number, height: number): SquareSet {
    if (rank < 0 || rank >= height) return SquareSet.empty();
    const maxSquare = width * height;
    const bitParts = [0, 0, 0, 0];
    for (let file = 0; file < width; file++) {
      const square = rank * width + file;
      if (square < maxSquare) {
        const part = Math.floor(square / 32);
        const idx = square % 32;
        bitParts[part] |= 1 << idx;
      }
    }
    const paddedBitParts: Tuple<number, 4> = [
      bitParts[0] ?? 0,
      bitParts[1] ?? 0,
      bitParts[2] ?? 0,
      bitParts[3] ?? 0,
    ];
    return new SquareSet(paddedBitParts);
  }

  static fromFile64(file: number): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0x0101_0101 << file, 0x0101_0101 << file, 0, 0]);
  }
  static fromFileWH(file: number, width: number, height: number): SquareSet {
    if (file < 0 || file >= width) return SquareSet.empty();
    const bitParts: number[] = [0, 0, 0, 0];
    for (let rank = 0; rank < height; rank++) {
      const square = rank * width + file;
      if (square < 128) {
        const part = Math.floor(square / 32);
        const idx = square % 32;
        bitParts[part] |= 1 << idx;
      }
    }
    const paddedBitParts: Tuple<number, 4> = [
      bitParts[0] ?? 0,
      bitParts[1] ?? 0,
      bitParts[2] ?? 0,
      bitParts[3] ?? 0,
    ];
    return new SquareSet(paddedBitParts);
  }

  // Note: these 2 pad functions below just represent a mask to make sure we keep only the relevant bits for a given size.
  // It will be invoked after each bit manipulation to maintain consistency so the values do not "overflow" and corrupt the board representation even after chained bits operations.
  padWH(width: number, height: number): SquareSet {
    const maxSquare = width * height;
    if (maxSquare >= 128) return this;
    // Create a mask with only the relevant bits set
    const maskParts: number[] = [0, 0, 0, 0];
    for (let sq = 0; sq < maxSquare; sq++) {
      const part = Math.floor(sq / 32);
      const idx = sq % 32;
      maskParts[part] |= 1 << idx;
    }
    return new SquareSet([
      this.bitParts[0] & maskParts[0],
      this.bitParts[1] & maskParts[1],
      this.bitParts[2] & maskParts[2],
      this.bitParts[3] & maskParts[3],
    ]);
  }
  padSquare(size: number): SquareSet {
    const maxSquare = size * size;
    if (maxSquare >= 128) return this;
    const maskParts: number[] = [0, 0, 0, 0];
    for (let part = 0; part < 4; part++) {
      const start = part * 32;
      const end = Math.min(maxSquare, start + 32);
      if (end > start) {
        maskParts[part] = (1 << (end - start)) - 1;
      }
    }
    return new SquareSet([
      this.bitParts[0] & maskParts[0],
      this.bitParts[1] & maskParts[1],
      this.bitParts[2] & maskParts[2],
      this.bitParts[3] & maskParts[3],
    ]);
  }

  static corners64(): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0x81, 0x8100_0000, 0, 0]);
  }
  static cornersWH(width: number, height: number): SquareSet {
    const maxSquare = width * height;
    const indices = [
      0,
      width - 1,
      (height - 1) * width,
      (height - 1) * width + width - 1,
    ];
    const bitParts = [0, 0, 0, 0];
    for (const idx of indices) {
      if (idx >= 0 && idx < maxSquare) {
        const part = Math.floor(idx / 32);
        const bit = idx % 32;
        bitParts[part] |= 1 << bit;
      }
    }

    return new SquareSet(
      [
        bitParts[0] ?? 0,
        bitParts[1] ?? 0,
        bitParts[2] ?? 0,
        bitParts[3] ?? 0,
      ] as const,
    );
  }

  static center64(): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0x1800_0000, 0x18, 0, 0]);
  }
  static centerWH(width: number, height: number): SquareSet {
    const maxSquare = width * height;
    const bitParts = [0, 0, 0, 0];
    const indices: number[] = [];
    const midRanks = height % 2 === 0 ? [height / 2 - 1, height / 2] : [Math.floor(height / 2)];
    const midFiles = width % 2 === 0 ? [width / 2 - 1, width / 2] : [Math.floor(width / 2)];
    for (const rank of midRanks) {
      for (const file of midFiles) {
        const idx = rank * width + file;
        if (idx >= 0 && idx < maxSquare) indices.push(idx);
      }
    }
    for (const idx of indices) {
      const part = Math.floor(idx / 32);
      const bit = idx % 32;
      bitParts[part] |= 1 << bit;
    }
    return new SquareSet(
      [
        bitParts[0] ?? 0,
        bitParts[1] ?? 0,
        bitParts[2] ?? 0,
        bitParts[3] ?? 0,
      ] as const,
    );
  }

  static backranks64(): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0xff, 0xff00_0000, 0, 0]);
  }
  static backranksWH(width: number, height: number): SquareSet {
    const backrank = [0, 0, 0, 0];
    for (let file = 0; file < width; file++) {
      const square = (height - 1) * width + file;
      const part = Math.floor(square / 32);
      const idx = square % 32;
      backrank[part] |= 1 << idx;
    }
    return new SquareSet(
      [
        backrank[0] ?? 0,
        backrank[1] ?? 0,
        backrank[2] ?? 0,
        backrank[3] ?? 0,
      ] as const,
    );
  }

  static backrank64(playerIndex: PlayerIndex): SquareSet {
    // TODO: this is only correct for chess for now
    return playerIndex === 'p1' ? new SquareSet([0xff, 0, 0, 0]) : new SquareSet([0, 0xff00_0000, 0, 0]);
  }
  static backrankWH(playerIndex: PlayerIndex, width: number, height: number): SquareSet {
    const backrank = [0, 0, 0, 0];
    const rank = playerIndex === 'p1' ? height - 1 : 0;
    for (let file = 0; file < width; file++) {
      const square = rank * width + file;
      const part = Math.floor(square / 32);
      const idx = square % 32;
      backrank[part] |= 1 << idx;
    }
    return new SquareSet(
      [
        backrank[0] ?? 0,
        backrank[1] ?? 0,
        backrank[2] ?? 0,
        backrank[3] ?? 0,
      ] as const,
    );
  }

  static lightSquares64(): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0x55aa_55aa, 0x55aa_55aa, 0, 0]);
  }
  static lightSquaresWH(width: number, height: number): SquareSet {
    const lightSquares = [0, 0, 0, 0];
    for (let rank = 0; rank < height; rank++) {
      for (let file = 0; file < width; file++) {
        if ((rank + file) % 2 === 0) {
          const square = rank * width + file;
          const part = Math.floor(square / 32);
          const idx = square % 32;
          lightSquares[part] |= 1 << idx;
        }
      }
    }
    return new SquareSet(
      [
        lightSquares[0] ?? 0,
        lightSquares[1] ?? 0,
        lightSquares[2] ?? 0,
        lightSquares[3] ?? 0,
      ] as const,
    );
  }

  static darkSquares64(): SquareSet {
    // TODO: this is only correct for chess for now
    return new SquareSet([0xaa55_aa55, 0xaa55_aa55, 0, 0]);
  }
  static darkSquaresWH(width: number, height: number): SquareSet {
    const darkSquares = [0, 0, 0, 0];
    for (let rank = 0; rank < height; rank++) {
      for (let file = 0; file < width; file++) {
        if ((rank + file) % 2 !== 0) {
          const square = rank * width + file;
          const part = Math.floor(square / 32);
          const idx = square % 32;
          darkSquares[part] |= 1 << idx;
        }
      }
    }
    return new SquareSet(
      [
        darkSquares[0] ?? 0,
        darkSquares[1] ?? 0,
        darkSquares[2] ?? 0,
        darkSquares[3] ?? 0,
      ] as const,
    );
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
  complementWH(width: number, height: number): SquareSet {
    return this.complement().padWH(width, height);
  }

  xor(other: SquareSet): SquareSet {
    return new SquareSet([
      this.bitParts[0] ^ other.bitParts[0],
      this.bitParts[1] ^ other.bitParts[1],
      this.bitParts[2] ^ other.bitParts[2],
      this.bitParts[3] ^ other.bitParts[3],
    ]);
  }
  xorWH(other: SquareSet, width = 8, height = 8): SquareSet {
    return this.xor(other)
      .padWH(width, height); // only keeping valid bits
  }

  union(other: SquareSet): SquareSet {
    return new SquareSet([
      this.bitParts[0] | other.bitParts[0],
      this.bitParts[1] | other.bitParts[1],
      this.bitParts[2] | other.bitParts[2],
      this.bitParts[3] | other.bitParts[3],
    ]);
  }
  unionWH(other: SquareSet, width = 8, height = 8): SquareSet {
    return this.union(other)
      .padWH(width, height); // only keeping valid bits
  }

  // safe
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
  diffWH(other: SquareSet, width = 8, height = 8): SquareSet {
    return this.diff(other)
      .padWH(width, height); // only keeping valid bits
  }

  diff64(other: SquareSet): SquareSet {
    return new SquareSet([this.bitParts[0] & ~other.bitParts[0], this.bitParts[1] & ~other.bitParts[1], 0, 0]);
  }

  // safe
  intersects(other: SquareSet): boolean {
    return this.intersect(other).nonEmpty();
  }

  // safe
  isDisjoint(other: SquareSet): boolean {
    return this.intersect(other).isEmpty();
  }

  supersetOf64(other: SquareSet): boolean {
    return other.diff64(this).isEmpty();
  }
  supersetWH(other: SquareSet, width: number, height: number): boolean {
    const a = this.padWH(width, height);
    const b = other.padWH(width, height);
    return b.diff(a).isEmpty();
  }

  subsetOf64(other: SquareSet): boolean {
    return this.diff64(other).isEmpty();
  }
  subsetWH(other: SquareSet, width: number, height: number): boolean {
    const a = this.padWH(width, height);
    const b = other.padWH(width, height);
    return a.diff(b).isEmpty();
  }

  shr64(shift: number): SquareSet {
    if (shift >= 64) return SquareSet.empty();
    if (shift >= 32) return new SquareSet([this.bitParts[1] >>> (shift - 32), 0, 0, 0]);
    if (shift > 0) {
      return new SquareSet([
        (this.bitParts[0] >>> shift) ^ (this.bitParts[1] << (32 - shift)),
        this.bitParts[1] >>> shift,
        0,
        0,
      ]);
    }
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
  shrWH(shift: number, width: number, height: number): SquareSet {
    if (shift <= 0) return this.padWH(width, height);
    const maxSquare = width * height;
    if (shift >= maxSquare) return SquareSet.empty();

    let result = SquareSet.empty();
    for (let sq = shift; sq < maxSquare; sq++) {
      if (this.has(sq)) {
        result = result.with(sq - shift);
      }
    }
    return result.padWH(width, height);
  }

  shl64(shift: number): SquareSet {
    // NOTE: theoretically, this shift and the above should be the same,
    //       except that because we'll end up storing some extra bits in the high/low part
    //       then shifting right immediately afterwards might get a different answer
    //       than you'd expect with a 64 bit shift.
    if (shift >= 64) return SquareSet.empty();
    if (shift >= 32) return new SquareSet([0, this.bitParts[0] << (shift - 32), 0, 0]);
    if (shift > 0) {
      return new SquareSet([
        this.bitParts[0] << shift,
        (this.bitParts[1] << shift) ^ (this.bitParts[0] >>> (32 - shift)),
        0,
        0,
      ]);
    }
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
  shlWH(shift: number, width: number, height: number): SquareSet {
    if (shift <= 0) return this.padWH(width, height);
    const maxSquare = width * height;
    if (shift >= maxSquare) return SquareSet.empty();

    let result = SquareSet.empty();
    for (let sq = 0; sq < maxSquare - shift; sq++) {
      if (this.has(sq)) {
        result = result.with(sq + shift);
      }
    }
    return result.padWH(width, height);
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
  bswapSize(size: number): SquareSet {
    let result = SquareSet.empty();
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const fromSq = row * size + col;
        const toSq = (size - 1 - row) * size + col;
        if (this.has(fromSq)) {
          result = result.with(toSq);
        }
      }
    }
    return result;
  }
  bswapWH(width: number, height: number): SquareSet {
    const maxSquare = width * height;
    let result = SquareSet.empty();
    for (let sq = 0; sq < maxSquare; sq++) {
      const row = Math.floor(sq / width);
      const col = sq % width;
      const mirroredRow = height - 1 - row;
      const mirroredSq = mirroredRow * width + col;
      if (this.has(sq)) {
        result = result.with(mirroredSq);
      }
    }
    return result.padWH(width, height);
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
  rbitWH(width: number, height: number): SquareSet {
    const maxSquare = width * height;
    let result = SquareSet.empty();
    for (let sq = 0; sq < maxSquare; sq++) {
      if (this.has(sq)) {
        const reversed = maxSquare - 1 - sq;
        result = result.with(reversed);
      }
    }
    return result.padWH(width, height);
  }

  // This is only used in attacks, which is only used for chess
  minus64(other: SquareSet): SquareSet {
    const lo = this.bitParts[0] - other.bitParts[0];
    const c = ((lo & other.bitParts[0] & 1) + (other.bitParts[0] >>> 1) + (lo >>> 1)) >>> 31;
    return new SquareSet([lo, this.bitParts[1] - (other.bitParts[1] + c), 0, 0]);
  }
  minusWH(other: SquareSet, width: number, height: number): SquareSet {
    const maxSquare = width * height;
    let result = SquareSet.empty();
    for (let sq = 0; sq < maxSquare; sq++) {
      if (this.has(sq) && !other.has(sq)) {
        result = result.with(sq);
      }
    }
    return result.padWH(width, height);
  }

  // safe
  equals(other: SquareSet): boolean {
    return (
      this.bitParts[0] === other.bitParts[0]
      && this.bitParts[1] === other.bitParts[1]
      && this.bitParts[2] === other.bitParts[2]
      && this.bitParts[3] === other.bitParts[3]
    );
  }

  // safe
  size(): number {
    return (
      popcnt32(this.bitParts[0]) + popcnt32(this.bitParts[1]) + popcnt32(this.bitParts[2]) + popcnt32(this.bitParts[3])
    );
  }

  // safe
  isEmpty(): boolean {
    return this.bitParts[0] === 0 && this.bitParts[1] === 0 && this.bitParts[2] === 0 && this.bitParts[3] === 0;
  }

  // safe
  nonEmpty(): boolean {
    return this.bitParts[0] !== 0 || this.bitParts[1] !== 0 || this.bitParts[2] !== 0 || this.bitParts[3] !== 0;
  }

  // safe
  has(square: Square): boolean {
    // console.log(`square: ${square}`);
    return (
      0
        !== bitPartMap(square)({
          [BitPartTarget.Gte128]: (_: number) => 0,
          [BitPartTarget.Gte96]: (square: number) => this.bitParts[3] & (1 << (square - 96)),
          [BitPartTarget.Gte64]: (square: number) => this.bitParts[2] & (1 << (square - 64)),
          [BitPartTarget.Gte32]: (square: number) => this.bitParts[1] & (1 << (square - 32)),
          [BitPartTarget.Gt0]: (square: number) => this.bitParts[0] & (1 << square),
          [BitPartTarget.Default]: () => this.bitParts[0] & 1,
        })
    );
  }

  // works as a generic function, just do not use an index that is outside the range of the board
  set(square: Square, on: boolean): SquareSet {
    return on ? this.with(square) : this.without(square);
  }

  // works as a generic function, just do not use an index that is outside the range of the board
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

  // works as a generic function, just do not use an index that is outside the range of the board
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

  // works as a generic function, just do not use an index that is outside the range of the board
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

  // works as a generic function, relies on the fact no square outside the range of the board is set
  last(): Square | undefined {
    if (this.bitParts[3] !== 0) return 127 - Math.clz32(this.bitParts[3]);
    if (this.bitParts[2] !== 0) return 95 - Math.clz32(this.bitParts[2]);
    if (this.bitParts[1] !== 0) return 63 - Math.clz32(this.bitParts[1]);
    if (this.bitParts[0] !== 0) return 31 - Math.clz32(this.bitParts[0]);
    return;
  }

  // works as a generic function, relies on the fact no square outside the range of the board is set
  first(): Square | undefined {
    if (this.bitParts[0] !== 0) return 31 - Math.clz32(this.bitParts[0] & -this.bitParts[0]);
    if (this.bitParts[1] !== 0) return 63 - Math.clz32(this.bitParts[1] & -this.bitParts[1]);
    if (this.bitParts[2] !== 0) return 95 - Math.clz32(this.bitParts[2] & -this.bitParts[2]);
    if (this.bitParts[3] !== 0) return 127 - Math.clz32(this.bitParts[3] & -this.bitParts[3]);
    return;
  }

  // works as a generic function, relies on the fact no square outside the range of the board is set
  withoutFirst(): SquareSet {
    if (this.bitParts[0] !== 0) return this.copy({ 0: v => v & (v - 1) });
    if (this.bitParts[1] !== 1) return this.copy({ 1: v => v & (v - 1) });
    if (this.bitParts[2] !== 2) return this.copy({ 2: v => v & (v - 1) });
    return this.copy({ 3: v => v & (v - 1) });
  }

  // works as a generic function, just do not use an index that is outside the range of the board
  moreThanOne(): boolean {
    // TODO: There is probably a more efficient way to do this, but
    // because we now have more combinations than we had before I went
    // for readability rather than efficiency.
    const count = [0, 1, 2, 3].map<number>(i => (this.bitParts[i] !== 0 ? 1 : 0)).reduce((x, y) => x + y);
    return (
      count > 1
      || (this.bitParts[0] & (this.bitParts[0] - 1)) !== 0
      || (this.bitParts[1] & (this.bitParts[1] - 1)) !== 0
      || (this.bitParts[2] & (this.bitParts[2] - 1)) !== 0
      || (this.bitParts[3] & (this.bitParts[3] - 1)) !== 0
    );
  }

  // works as a generic function, just do not use an index that is outside the range of the board
  singleSquare(): Square | undefined {
    return this.moreThanOne() ? undefined : this.last();
  }

  // works as a generic function, just do not use an index that is outside the range of the board
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

  toStringWH(width: number, height: number): string {
    let str = '';
    for (let rank = 0; rank < height; rank++) {
      let line = '';
      for (let file = 0; file < width; file++) {
        const sq = rank * width + file;
        line += this.has(sq) ? 'X ' : '. ';
      }
      str += line.trim() + '\n';
    }
    return str;
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
