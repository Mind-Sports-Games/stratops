import { expect, test } from '@jest/globals';
import { makeUci, parseUci } from './util.js';

test('parse uci', () => {
  expect(parseUci('chess')('a1a2')).toEqual({ from: 0, to: 8 });
  expect(parseUci('chess')('h7h8k')).toEqual({ from: 55, to: 63, promotion: 'k-piece' });
  expect(parseUci('chess')('P@h1')).toEqual({ role: 'p-piece', to: 7 });
});

test('make uci', () => {
  expect(makeUci('chess')({ role: 'q-piece', to: 1 })).toBe('Q@b1');
  expect(makeUci('chess')({ from: 2, to: 3 })).toBe('c1d1');
  expect(makeUci('chess')({ from: 0, to: 0, promotion: 'p-piece' })).toBe('a1a1p');
});

test('make uci', () => {
  expect(makeUci('linesofaction')({ from: 1, to: 17 })).toBe('b1b3');
  expect(makeUci('linesofaction')({ from: 6, to: 22 })).toBe('g1g3');
  expect(makeUci('linesofaction')({ from: 58, to: 44 })).toBe('c8e6');
});
