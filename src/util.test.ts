import { expect, test } from '@jest/globals';
import { parseUci, makeUci } from './util.js';

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
