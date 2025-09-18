import { expect, test } from '@jest/globals';
import { between, bishopAttacksWH, linesOfActionAttacks, ray, rookAttacks, rookAttacksWH } from './attacks.js';
import { Board } from './board.js';
import { SquareSet } from './squareSet.js';
import type { PlayerIndex, Square } from './types.js';
import { defined, parseSquare as parseSquareRules } from './util.js';

const parseSquare = parseSquareRules('chess');

test('rook attacks', () => {
  const d6 = 43;
  expect(rookAttacks(d6, new SquareSet([0x2826f5b9, 0x3f7f2880, 0, 0]))).toEqual(
    new SquareSet([0x8000000, 0x83708, 0, 0]),
  );
  expect(rookAttacks(d6, SquareSet.empty())).toEqual(SquareSet.fromFile64(3).xor(SquareSet.fromRank64(5)));
});

test('ray', () => {
  expect(ray(0, 8)).toEqual(SquareSet.fromFile64(0));
});

test('between', () => {
  expect(between(42, 42)).toEqual(SquareSet.empty());
  expect(Array.from(between(0, 3))).toEqual([1, 2]);

  expect(Array.from(between(61, 47))).toEqual([54]);
  expect(Array.from(between(47, 61))).toEqual([54]);
});

type LoaMoveTest = {
  playerIndex: PlayerIndex;
  start: Square | undefined;
  targets: string[];
};

test('lines-of-action first move generation', () => {
  const pos = Board.linesOfAction();
  const tests: LoaMoveTest[] = [
    { playerIndex: 'p2', start: parseSquare('b8'), targets: ['b6', 'd6', 'h8'] },
    { playerIndex: 'p2', start: parseSquare('c8'), targets: ['a6', 'c6', 'e6'] },
    { playerIndex: 'p2', start: parseSquare('d8'), targets: ['b6', 'd6', 'f6'] },
    { playerIndex: 'p2', start: parseSquare('e8'), targets: ['c6', 'e6', 'g6'] },
    { playerIndex: 'p2', start: parseSquare('e8'), targets: ['c6', 'e6', 'g6'] },
    { playerIndex: 'p2', start: parseSquare('f8'), targets: ['d6', 'f6', 'h6'] },
    { playerIndex: 'p2', start: parseSquare('g8'), targets: ['a8', 'e6', 'g6'] },

    { playerIndex: 'p2', start: parseSquare('b1'), targets: ['b3', 'd3', 'h1'] },
    { playerIndex: 'p2', start: parseSquare('c1'), targets: ['a3', 'c3', 'e3'] },
    { playerIndex: 'p2', start: parseSquare('d1'), targets: ['b3', 'd3', 'f3'] },
    { playerIndex: 'p2', start: parseSquare('e1'), targets: ['c3', 'e3', 'g3'] },
    { playerIndex: 'p2', start: parseSquare('e1'), targets: ['c3', 'e3', 'g3'] },
    { playerIndex: 'p2', start: parseSquare('f1'), targets: ['d3', 'f3', 'h3'] },
    { playerIndex: 'p2', start: parseSquare('g1'), targets: ['a1', 'e3', 'g3'] },
  ];
  tests.forEach(({ playerIndex, start, targets }) => {
    if (!defined(start)) return;
    const attacks = linesOfActionAttacks(playerIndex, start, pos.occupied, pos.p1, pos.p2);
    const targetSet = targets
      .map(parseSquare)
      .filter(defined)
      .reduce((range, square) => range.with(square), SquareSet.empty());
    expect(attacks).toEqual(targetSet);
  });
});

test('lines-of-action second move generation', () => {
  const pos = Board.linesOfAction();
  const c8 = 58;
  const c6 = 42;
  const piece = pos.take(c8);
  if (!defined(piece)) {
    // fail('there should always be a piece on c8 in lines of action?');
    return;
  }
  pos.set(c6, piece);
  const tests: LoaMoveTest[] = [
    { playerIndex: 'p1', start: parseSquare('a7'), targets: ['a1', 'c5', 'c7'] },
    { playerIndex: 'p1', start: parseSquare('a6'), targets: ['b7', 'c4'] },
    { playerIndex: 'p1', start: parseSquare('a5'), targets: ['c7', 'c5', 'c3'] },
    { playerIndex: 'p1', start: parseSquare('a4'), targets: ['c4', 'c2'] },
    { playerIndex: 'p1', start: parseSquare('a3'), targets: ['c5', 'c3', 'c1'] },
    { playerIndex: 'p1', start: parseSquare('a2'), targets: ['a8', 'c2', 'c4'] },

    { playerIndex: 'p1', start: parseSquare('h7'), targets: ['h1', 'f5', 'f7'] },
    { playerIndex: 'p1', start: parseSquare('h6'), targets: ['e6', 'f4', 'f8'] },
    { playerIndex: 'p1', start: parseSquare('h5'), targets: ['f7', 'f5', 'f3'] },
    { playerIndex: 'p1', start: parseSquare('h4'), targets: ['f6', 'f4', 'f2'] },
    { playerIndex: 'p1', start: parseSquare('h3'), targets: ['f3', 'f1', 'g4'] },
    { playerIndex: 'p1', start: parseSquare('h2'), targets: ['h8', 'f2', 'f4'] },
  ];
  tests.forEach(({ playerIndex, start, targets }) => {
    if (!defined(start)) return;
    const attacks = linesOfActionAttacks(playerIndex, start, pos.occupied, pos.p1, pos.p2);
    const targetSet = targets
      .map(parseSquare)
      .filter(defined)
      .reduce((range, square) => range.with(square), SquareSet.empty());
    expect(attacks).toEqual(targetSet);
  });
});

test('lines-of-action third move generation', () => {
  const pos = Board.linesOfAction();
  const c8 = 58;
  const c6 = 42;
  const h6 = 47;
  const e6 = 44;
  const piece = pos.take(c8);
  if (!defined(piece)) {
    // fail('there should always be a piece on c8 in lines of action?');
    return;
  }
  pos.set(c6, piece);
  const piece2 = pos.take(h6);
  if (!defined(piece2)) {
    // fail('there should always be a piece on h6 in lines of action?');
    return;
  }
  pos.set(e6, piece2);
  const tests: LoaMoveTest[] = [
    { playerIndex: 'p2', start: parseSquare('b8'), targets: ['b6', 'd6'] },
    { playerIndex: 'p2', start: parseSquare('c6'), targets: ['b7', 'c8', 'c4', 'd5'] },
    { playerIndex: 'p2', start: parseSquare('d8'), targets: ['b6', 'd6', 'f6'] },
    { playerIndex: 'p2', start: parseSquare('e8'), targets: ['b5', 'g6'] },
    { playerIndex: 'p2', start: parseSquare('f8'), targets: ['a8', 'd6', 'f6', 'g7'] },
    { playerIndex: 'p2', start: parseSquare('g8'), targets: ['g6'] },

    { playerIndex: 'p2', start: parseSquare('b1'), targets: ['b3', 'd3', 'h1'] },
    { playerIndex: 'p2', start: parseSquare('c1'), targets: ['a3', 'c3', 'd2'] },
    { playerIndex: 'p2', start: parseSquare('d1'), targets: ['b3', 'd3', 'f3'] },
    { playerIndex: 'p2', start: parseSquare('e1'), targets: ['c3', 'e4', 'g3'] },
    { playerIndex: 'p2', start: parseSquare('f1'), targets: ['d3', 'f3', 'h3'] },
    { playerIndex: 'p2', start: parseSquare('g1'), targets: ['a1', 'e3', 'g3'] },
  ];
  tests.forEach(({ playerIndex, start, targets }) => {
    if (!defined(start)) return;
    const attacks = linesOfActionAttacks(playerIndex, start, pos.occupied, pos.p1, pos.p2);
    const targetSet = targets
      .map(parseSquare)
      .filter(defined)
      .reduce((range, square) => range.with(square), SquareSet.empty());
    expect(attacks).toEqual(targetSet);
  });
});

test('minixiangqi rook attacks', () => {
  const rook = SquareSet.empty().with(24);
  const allies = SquareSet.empty().with(22).with(26);
  const enemies = SquareSet.empty().with(10).with(38);
  const occupied = rook.unionWH(allies, 7, 7).unionWH(enemies, 7, 7);
  /*
    . . . . . . .
    . . . E . . .
    . . . . . . .
    . A . R . A .
    . . . . . . .
    . . . E . . .
    . . . . . . .
  */
  const attacks = rookAttacksWH(24, occupied, 7, 7).diffWH(allies, 7, 7);
  expect(attacks.toStringWH(7, 7)).toEqual(
      '. . . . . . .\n' +
      '. . . X . . .\n'
    + '. . . X . . .\n'
    + '. . X . X . .\n'
    + '. . . X . . .\n'
    + '. . . X . . .\n'
    + '. . . . . . .\n',
  );
});

test('shogi rook attacks', () => {
  const rook = SquareSet.empty().with(0);
  const allies = SquareSet.empty().with(4).with(7).with(36);
  const enemies = SquareSet.empty().with(8).with(18);
  const occupied = rook.unionWH(allies, 9, 10).unionWH(enemies, 9, 10);
  /*
    R . . . A . . A E
    . . . . . . . . .
    E . . . . . . . .
    . . . . . . . . .
    A . . . . . . . .
    . . . . . . . . .
    . . . . . . . . .
    . . . . . . . . .
    . . . . . . . . .
    . . . . . . . . .
  */

  const attacks = rookAttacksWH(0, occupied, 9, 10).diffWH(allies, 9, 10);
  expect(attacks.toStringWH(9, 10)).toEqual(
      '. X X X . . . . .\n'
    + 'X . . . . . . . .\n'
    + 'X . . . . . . . .\n'
    + '. . . . . . . . .\n'
    + '. . . . . . . . .\n'
    + '. . . . . . . . .\n'
    + '. . . . . . . . .\n'
    + '. . . . . . . . .\n'
    + '. . . . . . . . .\n'
    + '. . . . . . . . .\n',
  );
});

test('shogi bishop attacks', () => {
  const bishop = SquareSet.empty().with(41);
  const allies = SquareSet.empty().with(21).with(71);
  const enemies = SquareSet.empty().with(33).with(81);
  const occupied = bishop.unionWH(allies, 9, 10).unionWH(enemies, 9, 10);
  /*
    . . . . . . . . .
    . . . . . . . . .
    . . . A . . . . .
    . . . . . . E . .
    . . . . . B . . .
    . . . . . . . . .
    . . . . . . . . .
    . . . . . . . . A
    . . . . . . . . .
    E . . . . . . . .
  */
  const attacks = bishopAttacksWH(41, occupied, 9, 10).diffWH(allies, 9, 10);
  expect(attacks.toStringWH(9, 10)).toEqual(
      '. . . . . . . . .\n'
    + '. . . . . . . . .\n'
    + '. . . . . . . . .\n'
    + '. . . . X . X . .\n'
    + '. . . . . . . . .\n'
    + '. . . . X . X . .\n'
    + '. . . X . . . X .\n'
    + '. . X . . . . . .\n'
    + '. X . . . . . . .\n'
    + 'X . . . . . . . .\n',
  );
});
