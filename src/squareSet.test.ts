import { expect, test } from '@jest/globals';
import { SquareSet } from './squareSet.js';

// TODO: add in some tests for the 128 bit versions.

test('full set has all', () => {
  for (let square = 0; square < 64; square++) {
    expect(SquareSet.full64().has(square)).toBe(true);
  }
});

test('size', () => {
  let squares = SquareSet.empty();
  for (let i = 0; i < 64; i++) {
    expect(squares.size()).toBe(i);
    squares = squares.with(i);
  }
});

test('shr64', () => {
  const r = new SquareSet([0xe0a1222, 0x1e222212, 0, 0]);
  expect(r.shr64(0)).toEqual(r);
  expect(r.shr64(1)).toEqual(new SquareSet([0x7050911, 0xf111109, 0, 0]));
  expect(r.shr64(3)).toEqual(new SquareSet([0x41c14244, 0x3c44442, 0, 0]));
  expect(r.shr64(31)).toEqual(new SquareSet([0x3c444424, 0x0, 0, 0]));
  expect(r.shr64(32)).toEqual(new SquareSet([0x1e222212, 0x0, 0, 0]));
  expect(r.shr64(33)).toEqual(new SquareSet([0xf111109, 0x0, 0, 0]));
  expect(r.shr64(62)).toEqual(new SquareSet([0x0, 0x0, 0, 0]));
});

test('shl64', () => {
  const r = new SquareSet([0xe0a1222, 0x1e222212, 0, 0]);
  expect(r.shl64(0)).toEqual(r);
  expect(r.shl64(1)).toEqual(new SquareSet([0x1c142444, 0x3c444424, 0, 0]));
  expect(r.shl64(3)).toEqual(new SquareSet([0x70509110, 0xf1111090, 0, 0]));
  expect(r.shl64(31)).toEqual(new SquareSet([0x0, 0x7050911, 0, 0]));
  expect(r.shl64(32)).toEqual(new SquareSet([0x0, 0xe0a1222, 0, 0]));
  expect(r.shl64(33)).toEqual(new SquareSet([0x0, 0x1c142444, 0, 0]));
  expect(r.shl64(62)).toEqual(new SquareSet([0x0, 0x80000000, 0, 0]));
  expect(r.shl64(63)).toEqual(new SquareSet([0x0, 0x0, 0, 0]));
});

test('more than one', () => {
  expect(new SquareSet([0, 0, 0, 0]).moreThanOne()).toBe(false);
  expect(new SquareSet([1, 0, 0, 0]).moreThanOne()).toBe(false);
  expect(new SquareSet([2, 0, 0, 0]).moreThanOne()).toBe(false);
  expect(new SquareSet([4, 0, 0, 0]).moreThanOne()).toBe(false);
  expect(new SquareSet([-2147483648, 0, 0, 0]).moreThanOne()).toBe(false);
  expect(new SquareSet([0, 1, 0, 0]).moreThanOne()).toBe(false);
  expect(new SquareSet([0, 2, 0, 0]).moreThanOne()).toBe(false);
  expect(new SquareSet([0, 4, 0, 0]).moreThanOne()).toBe(false);
  expect(new SquareSet([0, -2147483648, 0, 0]).moreThanOne()).toBe(false);

  expect(new SquareSet([1, 1, 0, 0]).moreThanOne()).toBe(true);
  expect(new SquareSet([3, 0, 0, 0]).moreThanOne()).toBe(true);
  expect(new SquareSet([-1, 0, 0, 0]).moreThanOne()).toBe(true);
  expect(new SquareSet([0, 3, 0, 0]).moreThanOne()).toBe(true);
  expect(new SquareSet([0, -1, 0, 0]).moreThanOne()).toBe(true);
});

test('fromSquare sets the correct bit for a smaller 7x7 board', () => {
  // Place a piece at square 10 (row 1, col 3)
  const minixiangqiSet = SquareSet.fromSquare(10);
  expect(minixiangqiSet.has(10)).toBe(true);

  // Should not set any other square
  for (let sq = 0; sq < 49; sq++) {
    if (sq !== 10) expect(minixiangqiSet.has(sq)).toBe(false);
  }
});

test('fromSquare sets the correct bit for a bigger 10x10 board', () => {
  // Place a piece at square 89 (row 8, col 9)
  const amazonsSet = SquareSet.fromSquare(89);
  expect(amazonsSet.has(89)).toBe(true);

  // Should not set any other square
  for (let sq = 0; sq < 100; sq++) {
    if (sq !== 89) expect(amazonsSet.has(sq)).toBe(false);
  }
});

test('fullWH sets all bits for a 7x7 and 9x10 board', () => {
  const set7 = SquareSet.fullWH(7, 7);
  for (let sq = 0; sq < 49; sq++) {
    expect(set7.has(sq)).toBe(true);
  }
  expect(set7.has(49)).toBe(false);
  expect(set7.has(100)).toBe(false);
  expect(set7.size()).toBe(49);

  const set9x10 = SquareSet.fullWH(9, 10);
  for (let sq = 0; sq < 90; sq++) {
    expect(set9x10.has(sq)).toBe(true);
  }
  expect(set9x10.has(90)).toBe(false);
  expect(set9x10.has(100)).toBe(false);
  expect(set9x10.size()).toBe(90);
});

test('fromRankWH sets all bits for a rank on a 7x7 and 9x10 board', () => {
  const set7 = SquareSet.fromRankWH(3, 7, 7);
  for (let file = 0; file < 7; file++) {
    const sq = 3 * 7 + file;
    expect(set7.has(sq)).toBe(true);
  }
  for (let sq = 0; sq < 49; sq++) {
    if (sq < 21 || sq > 27) expect(set7.has(sq)).toBe(false);
  }
  expect(SquareSet.fromRankWH(7, 7, 7).isEmpty()).toBe(true);
  expect(SquareSet.fromRankWH(-1, 7, 7).isEmpty()).toBe(true);

  const set9x10 = SquareSet.fromRankWH(5, 9, 10);
  for (let file = 0; file < 9; file++) {
    const sq = 5 * 9 + file;
    expect(set9x10.has(sq)).toBe(true);
  }
  for (let sq = 0; sq < 90; sq++) {
    if (sq < 45 || sq > 53) expect(set9x10.has(sq)).toBe(false);
  }
  expect(SquareSet.fromRankWH(10, 9, 10).isEmpty()).toBe(true);
  expect(SquareSet.fromRankWH(-1, 9, 10).isEmpty()).toBe(true);
});

test('fromFileWH sets all bits for a file on a 7x7 and 9x10 board', () => {
  const set7 = SquareSet.fromFileWH(2, 7, 7);
  for (let rank = 0; rank < 7; rank++) {
    const sq = rank * 7 + 2;
    expect(set7.has(sq)).toBe(true);
  }
  for (let sq = 0; sq < 49; sq++) {
    if (sq % 7 !== 2) expect(set7.has(sq)).toBe(false);
  }
  expect(SquareSet.fromFileWH(7, 7, 7).isEmpty()).toBe(true);
  expect(SquareSet.fromFileWH(-1, 7, 7).isEmpty()).toBe(true);

  const set9x10 = SquareSet.fromFileWH(3, 9, 10);
  for (let rank = 0; rank < 10; rank++) {
    const sq = rank * 9 + 3;
    expect(set9x10.has(sq)).toBe(true);
  }
  for (let sq = 0; sq < 90; sq++) {
    if (sq % 9 !== 3) expect(set9x10.has(sq)).toBe(false);
  }
  expect(SquareSet.fromFileWH(9, 9, 10).isEmpty()).toBe(true);
  expect(SquareSet.fromFileWH(-1, 9, 10).isEmpty()).toBe(true);
});

test('padWH masks out bits outside a 7x7 and 9x10 board', () => {
  const set7 = new SquareSet([0xffffffff, 0xffffffff, 0, 0]);
  const padded7 = set7.padWH(7, 7);
  for (let sq = 0; sq < 49; sq++) {
    expect(padded7.has(sq)).toBe(true);
  }
  for (let sq = 49; sq < 64; sq++) {
    expect(padded7.has(sq)).toBe(false);
  }
  expect(padded7.size()).toBe(49);

  const set9x10 = new SquareSet([0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff]);
  const padded9x10 = set9x10.padWH(9, 10);
  for (let sq = 0; sq < 90; sq++) {
    expect(padded9x10.has(sq)).toBe(true);
  }
  for (let sq = 90; sq < 128; sq++) {
    expect(padded9x10.has(sq)).toBe(false);
  }
  expect(padded9x10.size()).toBe(90);
});

test('cornersWH sets only the four corners on a 7x7 and 9x10 board', () => {
  const set7 = SquareSet.cornersWH(7, 7);
  const corners7 = [0, 6, 42, 48];
  corners7.forEach(sq => expect(set7.has(sq)).toBe(true));
  for (let sq = 0; sq < 49; sq++) {
    if (!corners7.includes(sq)) expect(set7.has(sq)).toBe(false);
  }
  expect(set7.size()).toBe(4);

  const set9x10 = SquareSet.cornersWH(9, 10);
  const corners9x10 = [0, 8, 81, 89];
  corners9x10.forEach(sq => expect(set9x10.has(sq)).toBe(true));
  for (let sq = 0; sq < 90; sq++) {
    if (!corners9x10.includes(sq)) expect(set9x10.has(sq)).toBe(false);
  }
  expect(set9x10.size()).toBe(4);
});

test('centerWH sets the central square(s) for 7x7, 10x10, and 9x10 boards', () => {
  // 7x7: center square is row 3, col 3
  const set7 = SquareSet.centerWH(7, 7);
  expect(set7.has(24)).toBe(true);
  expect(set7.size()).toBe(1);
  for (let sq = 0; sq < 49; sq++) {
    if (sq !== 24) expect(set7.has(sq)).toBe(false);
  }

  // 10x10: center squares are rows 4 & 5, cols 4 & 5)
  const set10 = SquareSet.centerWH(10, 10);
  const centers10 = [44, 45, 54, 55];
  centers10.forEach(sq => expect(set10.has(sq)).toBe(true));
  expect(set10.size()).toBe(4);
  for (let sq = 0; sq < 100; sq++) {
    if (!centers10.includes(sq)) expect(set10.has(sq)).toBe(false);
  }

  // 9x10: center squares are row 5, cols 5 & 6)
  const set9x10 = SquareSet.centerWH(9, 10);
  const centers9x10 = [40, 49];
  centers9x10.forEach(sq => expect(set9x10.has(sq)).toBe(true));
  expect(set9x10.size()).toBe(2);
  for (let sq = 0; sq < 90; sq++) {
    if (!centers9x10.includes(sq)) expect(set9x10.has(sq)).toBe(false);
  }
});

test('backranksWH sets all bits for the last rank on a 7x7 and 9x10 board', () => {
  const set7 = SquareSet.backranksWH(7, 7);
  for (let file = 0; file < 7; file++) {
    const sq = 6 * 7 + file;
    expect(set7.has(sq)).toBe(true);
  }
  for (let sq = 0; sq < 49; sq++) {
    if (sq < 42 || sq > 48) expect(set7.has(sq)).toBe(false);
  }
  expect(set7.size()).toBe(7);

  const set9x10 = SquareSet.backranksWH(9, 10);
  for (let file = 0; file < 9; file++) {
    const sq = 9 * 9 + file;
    expect(set9x10.has(sq)).toBe(true);
  }
  for (let sq = 0; sq < 90; sq++) {
    if (sq < 81 || sq > 89) expect(set9x10.has(sq)).toBe(false);
  }
  expect(set9x10.size()).toBe(9);
});

test('backrankWH sets all bits for the correct backrank for each player on a 7x7 and 9x10 board', () => {
  const setP1_7 = SquareSet.backrankWH('p1', 7, 7);
  for (let file = 0; file < 7; file++) {
    const sq = 6 * 7 + file;
    expect(setP1_7.has(sq)).toBe(true);
  }
  for (let sq = 0; sq < 49; sq++) {
    if (sq < 42 || sq > 48) expect(setP1_7.has(sq)).toBe(false);
  }
  expect(setP1_7.size()).toBe(7);

  const setP2_7 = SquareSet.backrankWH('p2', 7, 7);
  for (let file = 0; file < 7; file++) {
    expect(setP2_7.has(file)).toBe(true);
  }
  for (let sq = 7; sq < 49; sq++) {
    expect(setP2_7.has(sq)).toBe(false);
  }
  expect(setP2_7.size()).toBe(7);

  const setP1_9x10 = SquareSet.backrankWH('p1', 9, 10);
  for (let file = 0; file < 9; file++) {
    const sq = 9 * 9 + file;
    expect(setP1_9x10.has(sq)).toBe(true);
  }
  for (let sq = 0; sq < 90; sq++) {
    if (sq < 81 || sq > 89) expect(setP1_9x10.has(sq)).toBe(false);
  }
  expect(setP1_9x10.size()).toBe(9);

  const setP2_9x10 = SquareSet.backrankWH('p2', 9, 10);
  for (let file = 0; file < 9; file++) {
    expect(setP2_9x10.has(file)).toBe(true);
  }
  for (let sq = 9; sq < 90; sq++) {
    expect(setP2_9x10.has(sq)).toBe(false);
  }
  expect(setP2_9x10.size()).toBe(9);
});

test('lightSquaresWH and darkSquaresWH set correct squares on a 7x7 and 9x10 board', () => {
  const light7 = SquareSet.lightSquaresWH(7, 7);
  const dark7 = SquareSet.darkSquaresWH(7, 7);
  for (let sq = 0; sq < 49; sq++) {
    const isLight = light7.has(sq);
    const isDark = dark7.has(sq);
    expect(isLight !== isDark).toBe(true);
    expect(isLight || isDark).toBe(true);
  }
  for (let rank = 0; rank < 7; rank++) {
    for (let file = 0; file < 7; file++) {
      const sq = rank * 7 + file;
      if ((rank + file) % 2 === 0) {
        expect(light7.has(sq)).toBe(true);
        expect(dark7.has(sq)).toBe(false);
      } else {
        expect(light7.has(sq)).toBe(false);
        expect(dark7.has(sq)).toBe(true);
      }
    }
  }
  expect(light7.size()).toBe(25);
  expect(dark7.size()).toBe(24);

  const light9x10 = SquareSet.lightSquaresWH(9, 10);
  const dark9x10 = SquareSet.darkSquaresWH(9, 10);
  for (let sq = 0; sq < 90; sq++) {
    const isLight = light9x10.has(sq);
    const isDark = dark9x10.has(sq);
    expect(isLight !== isDark).toBe(true);
    expect(isLight || isDark).toBe(true);
  }
  for (let rank = 0; rank < 10; rank++) {
    for (let file = 0; file < 9; file++) {
      const sq = rank * 9 + file;
      if ((rank + file) % 2 === 0) {
        expect(light9x10.has(sq)).toBe(true);
        expect(dark9x10.has(sq)).toBe(false);
      } else {
        expect(light9x10.has(sq)).toBe(false);
        expect(dark9x10.has(sq)).toBe(true);
      }
    }
  }
  expect(light9x10.size()).toBe(45);
  expect(dark9x10.size()).toBe(45);
});

test('complementWH inverts all bits within a 7x7 and 9x10 board', () => {
  // 7x7
  const set7 = SquareSet.empty().with(0).with(10).with(48);
  const complement7 = set7.complementWH(7, 7);

  expect(complement7.has(0)).toBe(false);
  expect(complement7.has(10)).toBe(false);
  expect(complement7.has(48)).toBe(false);

  for (let sq = 0; sq < 49; sq++) {
    if (![0, 10, 48].includes(sq)) expect(complement7.has(sq)).toBe(true);
  }
  expect(complement7.size()).toBe(46);

  // 9x10
  const set9x10 = SquareSet.empty().with(0).with(10).with(89);
  const complement9x10 = set9x10.complementWH(9, 10);

  expect(complement9x10.has(0)).toBe(false);
  expect(complement9x10.has(10)).toBe(false);
  expect(complement9x10.has(89)).toBe(false);

  for (let sq = 0; sq < 90; sq++) {
    if (![0, 10, 89].includes(sq)) expect(complement9x10.has(sq)).toBe(true);
  }
  expect(complement9x10.size()).toBe(87);
});

test('xorWH masks out bits outside a 7x7 board', () => {
  const setA = SquareSet.empty().with(0).with(10).with(48);
  // 63 is outside 7x7
  const setB = SquareSet.empty().with(10).with(24).with(48).with(63);

  const xor = setA.xorWH(setB, 7, 7);
  expect(xor.has(0)).toBe(true);
  expect(xor.has(24)).toBe(true);
  expect(xor.has(10)).toBe(false);
  expect(xor.has(48)).toBe(false);
  expect(xor.has(63)).toBe(false); // masked out

  // All other squares should not be set
  for (let sq = 0; sq < 49; sq++) {
    if (![0, 24].includes(sq)) expect(xor.has(sq)).toBe(false);
  }

  // The size should be 2
  expect(xor.size()).toBe(2);
});

test('unionWH masks out bits outside a 7x7 board', () => {
  const setA = SquareSet.empty().with(0).with(10).with(48);
  // 63 is outside 7x7
  const setB = SquareSet.empty().with(10).with(24).with(48).with(63);

  const union = setA.unionWH(setB, 7, 7);
  expect(union.has(0)).toBe(true);
  expect(union.has(10)).toBe(true);
  expect(union.has(24)).toBe(true);
  expect(union.has(48)).toBe(true);
  expect(union.has(63)).toBe(false); // masked out

  // All other squares should not be set
  for (let sq = 0; sq < 49; sq++) {
    if (![0, 10, 24, 48].includes(sq)) expect(union.has(sq)).toBe(false);
  }

  // The size should be 4
  expect(union.size()).toBe(4);
});

test('diffWH masks out bits outside a 7x7 board', () => {
  const setA = SquareSet.empty().with(0).with(10).with(48);
  // 63 is outside 7x7
  const setB = SquareSet.empty().with(10).with(24).with(48).with(63);

  const diff = setA.diffWH(setB, 7, 7);
  expect(diff.has(0)).toBe(true);
  expect(diff.has(10)).toBe(false);
  expect(diff.has(48)).toBe(false);
  expect(diff.has(24)).toBe(false);
  expect(diff.has(63)).toBe(false); // masked out

  // All other squares should not be set
  for (let sq = 0; sq < 49; sq++) {
    if (sq !== 0) expect(diff.has(sq)).toBe(false);
  }

  // The size should be 1
  expect(diff.size()).toBe(1);
});

test('intersects works correctly for any board size', () => {
  // 7x7
  const setA = SquareSet.empty().with(0).with(10).with(48);
  const setB = SquareSet.empty().with(10).with(24).with(48).with(63);

  // They intersect on 10 and 48 (inside 7x7)
  expect(setA.intersects(setB)).toBe(true);

  // Set squares outside 7x7 only in setC
  const setC = SquareSet.empty().with(63);
  expect(setA.intersects(setC)).toBe(false);

  // Set squares outside 7x7 only in setD
  const setD = SquareSet.empty().with(100);
  expect(setA.intersects(setD)).toBe(false);

  // Empty sets do not intersect
  expect(SquareSet.empty().intersects(SquareSet.empty())).toBe(false);

  // 9x10
  const setA9x10 = SquareSet.empty().with(0).with(10).with(89);
  const setB9x10 = SquareSet.empty().with(10).with(24).with(89).with(99);

  // They intersect on 10 and 89 (inside 9x10)
  expect(setA9x10.intersects(setB9x10)).toBe(true);

  // Set squares outside 9x10 only in setC9x10
  const setC9x10 = SquareSet.empty().with(99);
  expect(setA9x10.intersects(setC9x10)).toBe(false);

  // Set squares outside 9x10 only in setD9x10
  const setD9x10 = SquareSet.empty().with(120);
  expect(setA9x10.intersects(setD9x10)).toBe(false);

  // Empty sets do not intersect
  expect(SquareSet.empty().intersects(SquareSet.empty())).toBe(false);
});

test('subsetWH and supersetWH work correctly for any board size', () => {
  // 7x7
  const setA = SquareSet.empty().with(0).with(10).with(48);
  const setB = SquareSet.empty().with(0).with(10).with(24).with(48);

  // setA is a subset of setB, and setB is a superset of setA
  expect(setA.subsetWH(setB, 7, 7)).toBe(true);
  expect(setB.supersetWH(setA, 7, 7)).toBe(true);

  // setB is not a subset of setA, and setA is not a superset of setB
  expect(setB.subsetWH(setA, 7, 7)).toBe(false);
  expect(setA.supersetWH(setB, 7, 7)).toBe(false);

  // setA is a subset and superset of itself
  expect(setA.subsetWH(setA, 7, 7)).toBe(true);
  expect(setA.supersetWH(setA, 7, 7)).toBe(true);

  // The empty set is a subset of any set, and any set is a superset of the empty set
  expect(SquareSet.empty().subsetWH(setA, 7, 7)).toBe(true);
  expect(setA.supersetWH(SquareSet.empty(), 7, 7)).toBe(true);

  // 9x10
  const setA9x10 = SquareSet.empty().with(0).with(10).with(89);
  const setB9x10 = SquareSet.empty().with(0).with(10).with(24).with(89);

  // setA9x10 is a subset of setB9x10, and setB9x10 is a superset of setA9x10
  expect(setA9x10.subsetWH(setB9x10, 9, 10)).toBe(true);
  expect(setB9x10.supersetWH(setA9x10, 9, 10)).toBe(true);

  // setB9x10 is not a subset of setA9x10, and setA9x10 is not a superset of setB9x10
  expect(setB9x10.subsetWH(setA9x10, 9, 10)).toBe(false);
  expect(setA9x10.supersetWH(setB9x10, 9, 10)).toBe(false);

  // setA9x10 is a subset and superset of itself
  expect(setA9x10.subsetWH(setA9x10, 9, 10)).toBe(true);
  expect(setA9x10.supersetWH(setA9x10, 9, 10)).toBe(true);

  // The empty set is a subset of any set, and any set is a superset of the empty set
  expect(SquareSet.empty().subsetWH(setA9x10, 9, 10)).toBe(true);
  expect(setA9x10.supersetWH(SquareSet.empty(), 9, 10)).toBe(true);
});

test('shlWH and shrWH are logical opposites on a 7x7 and 9x10 board', () => {
  // 7x7
  const set7 = SquareSet.empty().with(0).with(10).with(24);

  // Shift left by 5
  const shl7 = set7.shlWH(5, 7, 7);
  expect(shl7.has(5)).toBe(true);
  expect(shl7.has(15)).toBe(true);
  expect(shl7.has(29)).toBe(true);

  // Shift right by 5 (should restore original positions)
  const shrBack7 = shl7.shrWH(5, 7, 7);
  expect(shrBack7.has(0)).toBe(true);
  expect(shrBack7.has(10)).toBe(true);
  expect(shrBack7.has(24)).toBe(true);

  for (let sq = 0; sq < 49; sq++) {
    if (![0, 10, 24].includes(sq)) expect(shrBack7.has(sq)).toBe(false);
  }
  expect(shrBack7.size()).toBe(3);

  // 9x10
  const set9x10 = SquareSet.empty().with(0).with(10).with(24);

  // Shift left by 5
  const shl9x10 = set9x10.shlWH(5, 9, 10);
  expect(shl9x10.has(5)).toBe(true);
  expect(shl9x10.has(15)).toBe(true);
  expect(shl9x10.has(29)).toBe(true);

  // Shift right by 5 (should restore original positions)
  const shrBack9x10 = shl9x10.shrWH(5, 9, 10);
  expect(shrBack9x10.has(0)).toBe(true);
  expect(shrBack9x10.has(10)).toBe(true);
  expect(shrBack9x10.has(24)).toBe(true);

  for (let sq = 0; sq < 90; sq++) {
    if (![0, 10, 24].includes(sq)) expect(shrBack9x10.has(sq)).toBe(false);
  }
  expect(shrBack9x10.size()).toBe(3);
});

test('bswapWH and rbitWH produce different board mirrors on a 7x7 board', () => {
  // Set squares in the first row: 0, 1, 2, 3, 4, 5 (not 6 to avoid symmetry)
  const set = SquareSet.empty().with(0).with(1).with(2).with(3).with(4).with(5);

  // bswapWH: vertical mirror, should move first row to last row (indices 42 to 48)
  const bswap = set.bswapWH(7, 7);
  for (let file = 0; file < 6; file++) {
    expect(bswap.has(42 + file)).toBe(true);
    expect(bswap.has(file)).toBe(false);
  }

  // rbitWH: full bit reversal, should move 0 to 48, 1 to 47, ...
  const rbit = set.rbitWH(7, 7);
  for (let file = 0; file < 6; file++) {
    expect(rbit.has(48 - file)).toBe(true);
    expect(rbit.has(file)).toBe(false);
  }

  // The size should remain 6 for both
  expect(bswap.size()).toBe(6);
  expect(rbit.size()).toBe(6);

  // The two results should not be equal
  expect(bswap.equals(rbit)).toBe(false);
});

test('minusWH removes squares present in the other set for a 7x7 board', () => {
  // Set squares 0, 10, 24, 48 in setA
  const setA = SquareSet.empty().with(0).with(10).with(24).with(48);
  // Set squares 10, 24 in setB
  const setB = SquareSet.empty().with(10).with(24);

  // minusWH should remove 10 and 24 from setA, leaving 0 and 48
  const result = setA.minusWH(setB, 7, 7);

  expect(result.has(0)).toBe(true);
  expect(result.has(48)).toBe(true);
  expect(result.has(10)).toBe(false);
  expect(result.has(24)).toBe(false);

  // All other squares should not be set
  for (let sq = 0; sq < 49; sq++) {
    if (![0, 48].includes(sq)) expect(result.has(sq)).toBe(false);
  }

  expect(result.size()).toBe(2);
});
