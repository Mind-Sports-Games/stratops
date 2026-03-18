import { expect, test } from '@jest/globals';
import { Board } from './board.js';
import { SquareSet } from './squareSet.js';
import type { Piece } from './types.js';

test('set and get', () => {
  const board = Board.empty('chess');
  expect(board.get(0)).toBeUndefined();
  const piece: Piece = { role: 'n-piece', playerIndex: 'p2', promoted: false };
  expect(board.set(0, piece)).toBeUndefined();
  expect(board.get(0)).toEqual(piece);
});

test('minixiangqi initial position', () => {
  const pos = Board.minixiangqi();
  expect(pos.p1.size()).toBe(12);
  expect(pos.p2.size()).toBe(12);
  expect(pos.occupied.size()).toBe(24);
  expect(pos['p-piece'].size()).toBe(10);
  expect(pos['r-piece'].intersect(pos.p1).size()).toBe(2);
  expect(pos['k-piece'].intersect(pos.p1)).toStrictEqual(SquareSet.fromSquare(3)); // 4th square indice 0001000
  expect(pos['k-piece'].intersect(pos.p2)).toStrictEqual(SquareSet.fromSquare(45)); // 46th square indice ... 0001000
  expect(pos.occupied.toStringWH(7, 7)).toEqual(
    'X X X X X X X\n'
      + 'X . X X X . X\n'
      + '. . . . . . .\n'
      + '. . . . . . .\n'
      + '. . . . . . .\n'
      + 'X . X X X . X\n'
      + 'X X X X X X X\n',
  );
});
