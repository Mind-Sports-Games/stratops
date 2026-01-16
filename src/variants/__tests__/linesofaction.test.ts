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

test('lines-of-action game with move undefined bug', () => {
  const pos = LinesOfAction.getClass().default();
  const moves = [
    'Lec3',
    'Lxf1',
    'Ldd3',
    'Lf2',
    'Lb3',
    'L4f4',
    'Lfxf4',
    'Lg4',
    'Lfh2',
    'Lgf3',
    'Lg3',
    'Lhf4',
    'Le3',
    'Lhf5',
    'Ld4',
    'Lc5',
    'Lbd1',
    'Lxd4',
    'Lh8',
    'Lab2',
    'Ld7',
    'Lac4',
    'Lxf4',
    'Lbe5',
    'L7xf5',
    'Lb6',
    'L3b1',
    'Lb7',
    'Lfd3',
    'Lfd5',
    'Lbe1',
    'Lfxf4',
    'Leg1',
    'Ld2',
    'Lgf2',
    'Ldc3',
  ];
  for (const san of moves) {
    const move = parseSan('linesofaction')(pos, san);
    expect(move).toBeDefined();
    pos.play(move!);
  }
  expect(pos.isEnd()).toBe(true);
});

test('lines-of-action game with move undefined bug', () => {
  const pos = LinesOfAction.getClass().default();
  const moves = [
    'Ldb3',
    'Lc2',
    'Lb4',
    'Lh1',
    'Lgg3',
    'Lb1',
    'Lxh3',
    'Lc2',
    'Lxa3',
    'Le2',
    'Lxh4',
    'Lc7',
    'Lb5',
    'Lxa3',
    'Lge6',
    'La1',
    'Lc5',
    'Lxe6',
    'Lxe6',
    'Lf4',
    'Lhf6',
    'Lg1',
    'Lfc6',
    'L1h3',
    'Lg5',
    'Lf5',
    'Lge7',
    'Ld2',
    'Lcf8',
    'Ld5',
    'Lcc4',
    'Lxe6',
    'Lec6',
    'L3b2',
    'Lff6',
    'La4',
    'Lxd5',
    'Lad4',
    'Lfd8',
    'Lff6',
    'Ld7',
  ];
  for (const san of moves) {
    const move = parseSan('linesofaction')(pos, san);
    expect(move).toBeDefined();
    pos.play(move!);
  }
  expect(pos.isEnd()).toBe(true);
});
