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
