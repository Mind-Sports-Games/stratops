import { expect, test } from '@jest/globals';
import type { Role } from '../../types';
import { makeSquare } from '../../util';
import type { GameFamily } from './GameFamily';
import { Gomoku } from './Gomoku';
import { Pente } from './Pente';
import { Renju } from './Renju';
import { fiveInARowSupport } from './testSupport';

type FiveInARowClass = typeof GameFamily;

// runs of two in every direction, so every five points along a line hold both colours
const pattern = (variant: FiveInARowClass): Map<string, Role> => {
  const stones = new Map<string, Role>();
  for (let file = 0; file < variant.width; file++) {
    for (let rank = 0; rank < variant.height; rank++) {
      const key = makeSquare(variant.rules)(file + rank * variant.width);
      stones.set(key, (Math.floor(file / 2) + rank) % 2 === 0 ? 'b-piece' : 'w-piece');
    }
  }
  return stones;
};

const without = (stones: Map<string, Role>, ...keys: string[]): Map<string, Role> => {
  const left = new Map(stones);
  for (const key of keys) left.delete(key);
  return left;
};

const withStones = (stones: Map<string, Role>, placed: [string, Role][]): Map<string, Role> =>
  new Map([...stones, ...placed]);

const positionIn = (variant: FiveInARowClass, stones: Map<string, Role>): GameFamily =>
  fiveInARowSupport(variant).position([...stones]);

// b8 to g8 reads B B _ B B B between white stones: only black's overline fits through d8
const overlineOnly = (variant: FiveInARowClass) =>
  withStones(without(pattern(variant), 'd8'), [
    ['a8', 'w-piece'],
    ['b8', 'b-piece'],
    ['c8', 'b-piece'],
    ['e8', 'b-piece'],
    ['f8', 'b-piece'],
    ['g8', 'b-piece'],
    ['h8', 'w-piece'],
  ]);

// b8 to f8 reads B B _ B B between white stones: only black's exact five fits through d8
const fiveOnly = (variant: FiveInARowClass) =>
  withStones(without(pattern(variant), 'd8'), [
    ['a8', 'w-piece'],
    ['b8', 'b-piece'],
    ['c8', 'b-piece'],
    ['e8', 'b-piece'],
    ['f8', 'b-piece'],
    ['g8', 'w-piece'],
  ]);

test('gomoku and renju end drawn before the board fills once no five is left to make', () => {
  for (const variant of [Gomoku, Renju]) {
    const pos = positionIn(variant, without(pattern(variant), 'a1', 'h8', 'o15'));
    expect(pos.isBoardFull()).toBe(false);
    expect(pos.isEnd()).toBe(true);
    expect(pos.outcome()).toEqual({ winner: undefined });
    expect(pos.emptyPoints()).toEqual([]);
  }
});

test('gomoku ends drawn on the drop that blocks the last five', () => {
  const { dropNext } = fiveInARowSupport(Gomoku);
  const before = positionIn(Gomoku, fiveOnly(Gomoku));
  expect(before.isEnd()).toBe(false);
  expect(before.nextColour()).toBe('w-piece');
  const after = dropNext(before, 'd8');
  expect(after.isEnd()).toBe(true);
  expect(after.outcome()).toEqual({ winner: undefined });
});

test('gomoku and renju are drawn when only an overline is left', () => {
  for (const variant of [Gomoku, Renju]) {
    const pos = positionIn(variant, overlineOnly(variant));
    expect(pos.isEnd()).toBe(true);
    expect(pos.outcome()).toEqual({ winner: undefined });
  }
});

test('pente plays on with no five left, since a capture can reopen a line', () => {
  expect(positionIn(Pente, without(pattern(Pente), 'a1', 'j10', 's19')).isEnd()).toBe(false);
});

test('pente plays on when only an overline is left', () => {
  expect(positionIn(Pente, overlineOnly(Pente)).isEnd()).toBe(false);
});

test('gomoku plays on while one colour can still fill a line', () => {
  expect(positionIn(Gomoku, without(pattern(Gomoku), 'a1', 'b1', 'c1', 'd1', 'e1')).isEnd()).toBe(false);
});
