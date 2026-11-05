import { expect, test } from '@jest/globals';
import { makeFen, parseFen } from '../../fen';
import { makeSquare, parseSquare } from '../../util';
import { variantClassFromKey, variantKeyToRules } from '../util';
import { GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Yonkoma10x10 } from './Yonkoma10x10';
import { Yonkoma12x12 } from './Yonkoma12x12';

const INITIAL_10 = 'c8C/10/10/10/10/10/10/10/10/C8c w 1';
const INITIAL_12 = 'c10C/12/12/12/12/12/12/12/12/12/12/C10c w 1';

const position = (rules: 'yonkoma10x10' | 'yonkoma12x12', fen: string) =>
  variantClassFromKey(rules).fromSetup(parseFen(rules)(fen).unwrap()).unwrap() as Yonkoma10x10;

const keys = (rules: 'yonkoma10x10' | 'yonkoma12x12', squares: number[]) => squares.map(makeSquare(rules)).sort();

test('yonkoma variants map to their own rules and board sizes', () => {
  expect(variantKeyToRules(VariantKey.yonkoma10x10)).toBe('yonkoma10x10');
  expect(variantKeyToRules(VariantKey.yonkoma12x12)).toBe('yonkoma12x12');
  expect(variantClassFromKey('yonkoma10x10')).toBe(Yonkoma10x10);
  expect(variantClassFromKey('yonkoma12x12')).toBe(Yonkoma12x12);
  expect(Yonkoma10x10.width).toBe(10);
  expect(Yonkoma10x10.height).toBe(10);
  expect(Yonkoma12x12.width).toBe(12);
  expect(Yonkoma12x12.height).toBe(12);
  expect(Yonkoma10x10.family).toBe(GameFamilyKey.yonkoma);
  expect(Yonkoma10x10.getVariantKeys()).toEqual([VariantKey.yonkoma10x10, VariantKey.yonkoma12x12]);
  expect(Yonkoma10x10.getInitialFen('p1')).toBe(INITIAL_10);
  expect(Yonkoma12x12.getInitialFen('p1')).toBe(INITIAL_12);
});

test('yonkoma moves are written as uci and a skipped turn as PASS', () => {
  const info = (uci: string) => ({ san: 'NOSAN', uci, fen: '', prevFen: '' });
  expect(Yonkoma10x10.getNotationStyle()).toBe(NotationStyle.uci);
  expect(Yonkoma10x10.computeMoveNotation(info('a1e5'))).toBe('a1e5');
  expect(Yonkoma12x12.computeMoveNotation(info('l12a1'))).toBe('l12a1');
  expect(Yonkoma10x10.computeMoveNotation(info('pass'))).toBe('PASS');
});

test('a pass has no squares to read', () => {
  expect(Yonkoma10x10.parseLexicalUci('pass')).toBeUndefined();
  expect(Yonkoma10x10.parseLexicalUci('a1e5')).toEqual({ from: 'a1', to: 'e5', promotion: undefined });
});

test('the fen round-trips on both boards, with two-digit runs of empty squares', () => {
  for (const [rules, fen] of [
    ['yonkoma10x10', INITIAL_10],
    ['yonkoma12x12', INITIAL_12],
    ['yonkoma10x10', '10/10/10/10/4cC4/4C5/10/10/10/9c b 2'],
    ['yonkoma12x12', '12/12/12/12/12/12/12/12/12/C11/c10C/11c w 3'],
  ] as const) {
    const setup = parseFen(rules)(fen).unwrap();
    expect(makeFen(rules)(setup)).toBe(fen);
    expect(setup.checkers?.size).toBe(4);
  }
  const setup = parseFen('yonkoma10x10')(INITIAL_10).unwrap();
  expect(setup.checkers?.get(parseSquare('yonkoma10x10')('a1')!)).toEqual({ role: 'c-piece', playerIndex: 'p1' });
  expect(setup.checkers?.get(parseSquare('yonkoma10x10')('a10')!)).toEqual({ role: 'c-piece', playerIndex: 'p2' });
  expect(setup.turn).toBe('p1');
  expect(parseFen('yonkoma10x10')('10/10/10/10/4cC4/4C5/10/10/10/9c b 2').unwrap().turn).toBe('p2');
});

test('a fen is refused when it does not fit the board or name the player', () => {
  const bad = ['c9C/10/10/10/10/10/10/10/10/C8c w 1', 'c8C/10/10/10/10/10/10/10/10/C8c x 1', INITIAL_12, 'c8X/10/10/10/10/10/10/10/10/C8c w 1', 'c8C/10/10/10/10/10/10/10/10/C08c w 1', 'c8C/10/10/10/10/10/10/10/10/C8c w'];
  for (const fen of bad) expect(parseFen('yonkoma10x10')(fen).isErr).toBe(true);
  expect(parseFen('yonkoma12x12')(INITIAL_10).isErr).toBe(true);
});

test('a position must hold two checkers a side on their own square colours', () => {
  const setup = (fen: string) => parseFen('yonkoma10x10')(fen).unwrap();
  expect(Yonkoma10x10.fromSetup(setup('c8C/10/10/10/10/10/10/10/8C1/C8c w 1')).isErr).toBe(true);
  expect(Yonkoma10x10.fromSetup(setup('9C/10/10/10/10/10/10/10/10/C8c w 1')).isErr).toBe(true);
  expect(Yonkoma10x10.fromSetup(setup('c8C/10/10/10/10/10/10/10/10/1C7c w 1')).isErr).toBe(true);
  expect(Yonkoma10x10.fromSetup(setup(INITIAL_10)).isOk).toBe(true);
});

test('the rule sheet moves: closer to the enemy pair, or as close and farther from the partner', () => {
  // Figure 2 of the rule sheet: P1 on a1 and b2, P2 on c4 and f1, P1 to move
  const pos = position('yonkoma10x10', '10/10/10/10/10/10/2c7/10/1C8/C4c4 w 5');
  const from = parseSquare('yonkoma10x10')('b2')!;
  // c3 and d4 come closer (sum of distances 6 to 4); c1 and e5 keep the sum and leave a1
  expect(keys('yonkoma10x10', pos.destinations(from))).toEqual(['c1', 'c3', 'd4', 'e5']);
  expect(pos.isLegal({ from, to: parseSquare('yonkoma10x10')('c1')! })).toBe(true);
  // a3 moves away, f6 is farther from both enemies, a1 holds the partner
  expect(pos.isLegal({ from, to: parseSquare('yonkoma10x10')('a3')! })).toBe(false);
  expect(pos.isLegal({ from, to: parseSquare('yonkoma10x10')('f6')! })).toBe(false);
  expect(pos.isLegal({ from, to: parseSquare('yonkoma10x10')('a1')! })).toBe(false);
  expect(pos.mustPass()).toBe(false);
  // from the start, every slide up the long diagonal brings a1 closer to both enemies
  const start = position('yonkoma10x10', INITIAL_10);
  expect(keys('yonkoma10x10', start.destinations(parseSquare('yonkoma10x10')('a1')!))).toEqual([
    'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8', 'i9',
  ]);
  expect(start.allDestinations().size).toBe(2);
  expect(start.outcome()).toBeUndefined();
});

test('a crosscut ends the game and the player to move has won', () => {
  const pos = position('yonkoma10x10', '10/10/10/10/4cC4/4C5/10/10/10/9c b 2');
  expect(pos.isCrosscut()).toBe(false);
  expect(pos.outcome()).toBeUndefined();
  const crosscut = position('yonkoma10x10', '10/10/10/10/4cC4/4Cc4/10/10/10/10 w 3');
  expect(crosscut.isCrosscut()).toBe(true);
  expect(crosscut.outcome()).toEqual({ winner: 'p1' });
  expect(crosscut.allDestinations().size).toBe(0);
  expect(crosscut.mustPass()).toBe(false);
  // four checkers in a 2x3 box are not a crosscut
  const box = position('yonkoma10x10', '10/10/10/10/4cC4/10/4cC4/10/10/10 w 3');
  expect(box.isCrosscut()).toBe(false);
  expect(box.outcome()).toBeUndefined();
});

test('play moves a checker and hands the turn over', () => {
  const pos = position('yonkoma10x10', INITIAL_10);
  const from = parseSquare('yonkoma10x10')('j10')!;
  const to = parseSquare('yonkoma10x10')('f6')!;
  expect(pos.isLegal({ from, to })).toBe(true);
  pos.play({ from, to });
  expect(pos.turn).toBe('p2');
  expect(pos.fen()).toBe('c9/10/10/10/5C4/10/10/10/10/C8c b 1');
  pos.pass();
  expect(pos.turn).toBe('p1');
  expect(pos.fullmoves).toBe(2);
  expect(makeFen('yonkoma10x10')(pos.toSetup())).toBe('c9/10/10/10/5C4/10/10/10/10/C8c w 2');
  expect(Yonkoma10x10.getPiecesCoordinates(INITIAL_10, 'p1')).toEqual([
    { piece: 'C', coord: 'a1' },
    { piece: 'C', coord: 'j10' },
  ]);
});
