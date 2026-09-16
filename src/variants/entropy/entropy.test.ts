import { expect, test } from '@jest/globals';
import { makeFen, parseFen, parsePiece } from '../../fen';
import { makeSquare, parseSquare } from '../../util';
import { GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { gameFamilyClass, variantClass, variantClassFromKey } from '../util';
import { Entropy } from './Entropy';

const midRoundFen = 'Rk5/7/3y3/7/7/7/6P[g] b 3 0 1 5';

test('entropy is wired as its own game family with a single variant', () => {
  expect(variantClass('entropy')).toBe(Entropy);
  expect(variantClassFromKey(VariantKey.entropy)).toBe(Entropy);
  expect(gameFamilyClass(GameFamilyKey.entropy).getVariantKeys()).toEqual([VariantKey.entropy]);
  expect(Entropy.family).toBe(GameFamilyKey.entropy);
  expect(Entropy.getBoardDimensions()).toEqual({ files: 7, ranks: 7 });
  expect(Entropy.getNotationStyle()).toBe(NotationStyle.uci);
});

test('entropy initial fen matches strategygames', () => {
  expect(Entropy.getInitialFen('p1')).toBe('7/7/7/7/7/7/7[] w 0 0 1 1');
});

test('entropy initial fen parses to an empty position', () => {
  const setup = parseFen('entropy')(Entropy.getInitialFen('p1')).unwrap();
  expect(setup.board.occupied.isEmpty()).toBe(true);
  expect(setup.pockets?.count()).toBe(0);
  expect(setup.round).toBe(1);
  expect(Entropy.fromSetup(setup).isOk).toBe(true);
});

test('entropy fen round trips pieces, pocket, scores and round', () => {
  const setup = Entropy.parseFen(midRoundFen).unwrap();
  expect(setup.board.get(6)).toMatchObject({ role: 'p-piece', playerIndex: 'p1' });
  expect(setup.board.get(42)).toMatchObject({ role: 'r-piece', playerIndex: 'p1' });
  expect(setup.board.get(43)).toMatchObject({ role: 'k-piece', playerIndex: 'p2' });
  expect(setup.pockets?.p2['g-piece']).toBe(1);
  expect(setup.turn).toBe('p2');
  expect(setup.p1Score).toBe(3);
  expect(setup.p2Score).toBe(0);
  expect(setup.fullmoves).toBe(5);
  expect(makeFen('entropy')(setup)).toBe(midRoundFen);
});

test('entropy rejects a chess shaped fen', () => {
  expect(parseFen('entropy')('7/7/7/7/7/7/7 w - - 0 1').isErr).toBe(true);
});

test('entropy scores are read from the fen', () => {
  const fen = '7/7/7/7/7/7/7[] w 12 7 2 50';
  expect(Entropy.getScoreFromFen(fen, 'p1')).toBe(12);
  expect(Entropy.getScoreFromFen(fen, 'p2')).toBe(7);
});

const notation = (uci: string) => Entropy.computeMoveNotation({ san: '', uci, fen: '', prevFen: '' });

test('entropy notation is the uci action', () => {
  for (const uci of ['R@d4', 'a1a7', 'pass']) {
    expect(notation(uci)).toBe(uci);
  }
});

test('entropy notation hides the draw from the bag', () => {
  expect(notation('draw-r')).toBe('');
  expect(Entropy.combinedNotation([notation('draw-r'), notation('R@d4')])).toBe('R@d4');
  expect(Entropy.combinedNotation([notation('a1a7')])).toBe('a1a7');
});

const line = (s: string) => [...s].map(c => (c === '.' ? undefined : parsePiece(c)?.role));

test('entropy scores runs the same as strategygames', () => {
  const cases: [string, number][] = [
    ['rr', 2],
    ['r', 0],
    ['rg', 0],
    ['rgr', 3],
    ['rgbgr', 8],
    ['bbb', 7],
    ['r.r', 3],
    ['rg.gr', 8],
    ['r.gr', 0],
    ['.r', 0],
    ['r..gr', 0],
    ['rg.rg', 0],
    ['rg.bb', 2],
    ['.......', 0],
  ];
  for (const [run, score] of cases) {
    expect([run, Entropy.scoreLine(line(run))]).toEqual([run, score]);
  }
  expect(Entropy.guaranteedScore(Entropy.parseFen('7/7/7/7/7/7/RRRRRRR[] w 0 0 1 1').unwrap().board)).toBe(77);
});

const position = (fen: string) => Entropy.fromSetup(Entropy.parseFen(fen).unwrap()).unwrap() as Entropy;
const square = (name: string) => parseSquare('entropy')(name)!;

test('entropy chaos must draw before it can place', () => {
  const pos = position(Entropy.getInitialFen('p1'));
  expect(pos.isChaos()).toBe(true);
  expect(pos.mustDraw()).toBe(true);
  expect(pos.dropDests().isEmpty()).toBe(true);

  pos.draw('r-piece');
  expect(pos.turn).toBe('p1');
  expect(pos.mustDraw()).toBe(false);
  expect(pos.dropDests().size()).toBe(49);
  expect(pos.isLegal({ role: 'r-piece', to: square('d4') })).toBe(true);
  expect(pos.isLegal({ role: 'g-piece', to: square('d4') })).toBe(false);
  expect(pos.allDests().size).toBe(0);
});

test('entropy a placed counter belongs to order and slides like a rook', () => {
  const pos = position(Entropy.getInitialFen('p1'));
  pos.draw('p-piece');
  pos.play({ role: 'p-piece', to: square('a1') });

  expect(pos.board.get(square('a1'))).toMatchObject({ role: 'p-piece', playerIndex: 'p2' });
  expect(pos.pockets?.count()).toBe(0);
  expect(pos.turn).toBe('p2');
  expect(pos.isOrder()).toBe(true);
  expect(pos.canPass()).toBe(true);
  expect(pos.dropDests().isEmpty()).toBe(true);
  expect([...pos.dests(square('a1'))].map(makeSquare('entropy')).sort()).toEqual(
    ['a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1'],
  );
  expect(pos.isLegal({ from: square('a1'), to: square('g1') })).toBe(true);
  expect(pos.isLegal({ from: square('a1'), to: square('b2') })).toBe(false);
});

test('entropy slides stop before other counters', () => {
  const pos = position('7/7/7/7/7/7/r1g4[] b 0 0 1 1');
  expect([...pos.dests(square('a1'))].map(makeSquare('entropy')).sort()).toEqual(
    ['a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'b1'],
  );
});

test('entropy order scores after every action', () => {
  const pos = position('7/7/7/7/7/7/r1r4[R] w 0 0 1 3');
  pos.play({ role: 'r-piece', to: square('b1') });
  expect(pos.p2Score).toBe(7);
  expect(pos.p1Score).toBe(0);
  expect(makeFen('entropy')(pos.toSetup())).toBe('7/7/7/7/7/7/rrr4[] b 0 7 1 3');
});

const fullBoard = 'rgbrgbr/gbrgbrg/brgbrgb/rgbrgbr/gbrgbrg/brgbrgb/rgbrgb1';

test('entropy swaps roles on the drop that fills the board, and clears it on the next draw', () => {
  const pos = position(`${fullBoard}[R] w 0 0 1 49`);
  const bankedScore = Entropy.guaranteedScore(position(`${fullBoard.replace(/1$/, 'r')}[] b 0 0 1 49`).board);
  pos.play({ role: 'r-piece', to: square('g1') });

  expect(pos.round).toBe(2);
  expect(pos.p2Score).toBe(bankedScore);
  expect(pos.isBoardFull()).toBe(true);
  expect(pos.chaosPlayer()).toBe('p2');
  expect(pos.orderPlayer()).toBe('p1');
  expect(pos.turn).toBe('p2');
  expect(pos.mustDraw()).toBe(true);
  expect(pos.canPass()).toBe(false);
  expect(pos.isEnd()).toBe(false);
  expect(pos.outcome()).toBeUndefined();

  pos.draw('g-piece');
  expect(pos.board.occupied.isEmpty()).toBe(true);
  expect(pos.counterInPocket()).toBe('g-piece');
});

test('entropy is decided on score once both rounds are played', () => {
  const pos = position(`${fullBoard.toUpperCase()}[r] b 0 12 2 98`);
  pos.play({ role: 'r-piece', to: square('g1') });

  expect(pos.round).toBe(3);
  expect(pos.isBoardFull()).toBe(true);
  expect(pos.p1Score).toBe(0);
  expect(pos.p2Score).toBe(12);
  expect(pos.isEnd()).toBe(true);
  expect(pos.allDests().size).toBe(0);
  expect(pos.dropDests().isEmpty()).toBe(true);
  expect(pos.canPass()).toBe(false);
  expect(pos.outcome()).toEqual({ winner: 'p2' });
});

test('entropy outcome comes straight from a finished fen', () => {
  expect(position('7/7/7/7/7/7/7[] w 30 20 3 99').outcome()).toEqual({ winner: 'p1' });
  expect(position('7/7/7/7/7/7/7[] w 20 30 3 99').outcome()).toEqual({ winner: 'p2' });
  expect(position('7/7/7/7/7/7/7[] w 25 25 3 99').outcome()).toEqual({ winner: undefined });
  expect(position('7/7/7/7/7/7/7[] w 30 20 2 50').outcome()).toBeUndefined();
});

test('entropy lexical uci only describes board actions', () => {
  expect(Entropy.parseLexicalUci('pass')).toBeUndefined();
  expect(Entropy.parseLexicalUci('draw-r')).toBeUndefined();
  expect(Entropy.parseLexicalUci('R@d4')).toEqual({ from: 'd4', to: 'd4', dropRole: 'r-piece' });
  expect(Entropy.parseLexicalUci('a1a7')).toEqual({ from: 'a1', to: 'a7', promotion: undefined });
});
