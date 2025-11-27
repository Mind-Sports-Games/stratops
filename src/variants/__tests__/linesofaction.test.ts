import { expect, test } from '@jest/globals';
import { parseSan } from '../../san';
import { LinesOfAction } from '../linesofaction/LinesOfAction';

test('lines-of-action isplayerIndexConnected complex shape', () => {
  const pos = LinesOfAction.getClass().default();
  const moves = ['Ldd3', 'Lxf1', 'Ld5', 'L2f2', 'Lbd3', 'Lxc1', 'Ld6', 'Lxe1', 'Lb7', 'Lxg1', 'Lcc7'];
  for (const san of moves) {
    const move = parseSan('linesofaction')(pos, san);
    expect(move).toBeDefined();
    pos.play(move!);
  }

  expect(pos.board.p1.size()).toBe(8);
  expect(pos.board.p2.size()).toBe(12);

  const actual = Array.from(pos.board.p1);
  actual.sort((a, b) => a - b);

  const expected = [35, 43, 49, 50, 59, 60, 61, 62];
  expected.sort((a, b) => a - b);

  expect(actual).toEqual(expected);

  expect(pos.board.pieces('p1', 'l-piece')).toEqual({ 'bitParts': [0, 2013661192, 0, 0] });
  expect(pos.board.pieces('p2', 'l-piece')).toEqual({ 'bitParts': [16785776, 8487297, 0, 0] });

  expect(pos.isPlayerIndexConnected('p1')).toBe(true);
  expect(pos.isPlayerIndexConnected('p2')).toBe(false);
});

test('lines-of-action isplayerIndexConnected simple', () => {
  const pos = LinesOfAction.getClass().default();
  const moves = ['Ldb3', 'Lxf1', 'Lbb4', 'L2f2', 'Lbb6', 'Lxc1', 'Lb7', 'Lxe1', 'Lga8', 'Lxg1'];
  for (const san of moves) {
    const move = parseSan('linesofaction')(pos, san);
    expect(move).toBeDefined();
    pos.play(move!);
  }

  expect(pos.board.p1.size()).toBe(8);
  expect(pos.board.p2.size()).toBe(12);

  expect(pos.isPlayerIndexConnected('p1')).toBe(true);
  expect(pos.isPlayerIndexConnected('p2')).toBe(false);
});
