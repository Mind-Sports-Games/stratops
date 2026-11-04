import { expect, test } from '@jest/globals';
import { parseFen } from '../../fen';
import { VariantKey } from '../types';
import { variantClass, variantClassFromKey } from '../util';
import { Gomoku } from './Gomoku';
import { Pente } from './Pente';
import { black, fiveInARowSupport, white } from './testSupport';

const { keys, play, refused, fen, stateFields, read, position, dropNext } = fiveInARowSupport(Pente);

const initialFen = `${Array(19).fill('19').join('/')} b 1 o 0 0 1`;
const start = () => read(initialFen);

// the spare black stone on s19 makes it black's turn to close the sandwich on d1
const rowCaptured = () => dropNext(position([...black('a1', 's19'), ...white('b1', 'c1')]), 'd1');

test('pente is wired as a 19x19 five in a row variant', () => {
  expect(variantClass('pente')).toBe(Pente);
  expect(variantClassFromKey(VariantKey.pente)).toBe(Pente);
  expect(Pente.getBoardDimensions()).toEqual({ files: 19, ranks: 19 });
  expect(Pente.playerColors).toEqual({ p1: 'black', p2: 'white' });
});

test('pente initial fen matches strategygames, with both captures at zero', () => {
  expect(Pente.getInitialFen('p1')).toBe(initialFen);
  expect(fen(Pente.default())).toBe(initialFen);
});

test('pente offers every point of the 19x19 board', () => {
  expect(start().emptyPoints().length).toBe(361);
  expect(play(start(), 'B@s19').stones.size).toBe(1);
  expect(refused(Gomoku.default(), 'B@s19')).toBe(true);
});

test('pente opens with the same swap2 rules as gomoku', () => {
  const pos = play(start(), 'B@j10', 'W@j11', 'B@k10', 'swap2', 'W@l10', 'B@l11');
  expect(pos.openingStep).toBe('f');
  expect(pos.canSwap()).toBe(true);
  expect(pos.turn).toBe('p1');
});

test('pente a capture removes exactly two stones sandwiched along a row', () => {
  const after = rowCaptured();
  expect(keys(after.stones.keys())).toEqual(new Set(['a1', 's19', 'd1']));
  expect(after.captures).toEqual({ p1: 2, p2: 0 });
});

test('pente captures along columns and both diagonals at once', () => {
  const pos = position([
    ...black('m10', 'j13', 'm13', 'a1', 'c1', 'e1'),
    ...white('k10', 'l10', 'j11', 'j12', 'k11', 'l12'),
  ]);
  const after = dropNext(pos, 'j10');
  expect(keys(after.stones.keys())).toEqual(new Set(['m10', 'j13', 'm13', 'a1', 'c1', 'e1', 'j10']));
  expect(after.captures).toEqual({ p1: 6, p2: 0 });
});

test('pente takes a pair on a falling diagonal, looking back up it from the drop', () => {
  const after = dropNext(position([...black('a19', 's1'), ...white('b18', 'c17')]), 'd16');
  expect(keys(after.stones.keys())).toEqual(new Set(['a19', 's1', 'd16']));
  expect(after.captures).toEqual({ p1: 2, p2: 0 });
});

test("pente takes neither one stone, three stones, nor the capturing colour's own", () => {
  expect(dropNext(position([...black('a1'), ...white('b1')]), 'c1').stones.size).toBe(3);
  expect(dropNext(position([...black('a1', 'a5', 'c5'), ...white('b1', 'c1', 'd1')]), 'e1').stones.size).toBe(7);
  expect(dropNext(position([...black('a1', 'b1', 'c1'), ...white('a5', 'c5')]), 'e5').stones.size).toBe(6);
});

test('pente a stone dropped into the sandwich is safe', () => {
  const after = dropNext(position([...black('a1', 'd1'), ...white('b1')]), 'c1');
  expect(keys(after.stones.keys())).toEqual(new Set(['a1', 'b1', 'c1', 'd1']));
  expect(after.captures).toEqual({ p1: 0, p2: 0 });
});

test('gomoku has no captures', () => {
  const gomoku = fiveInARowSupport(Gomoku);
  const after = gomoku.dropNext(gomoku.position([...black('a1'), ...white('b1', 'c1')]), 'd1');
  expect(after.stones.size).toBe(4);
});

test('pente counts captured stones as dropped, so the turn order holds and the point is free again', () => {
  const after = rowCaptured();
  expect(after.nextColour()).toBe('w-piece');
  expect(after.turn).toBe('p2');
  expect(keys(after.emptyPoints()).has('b1')).toBe(true);
});

// P1 opens h8 black, h9 white, h7 black; P2's swap2 white on h6 then sandwiches h8 and h7
const capturedInOpening = () => play(start(), 'B@h8', 'W@h9', 'B@h7', 'swap2', 'W@h6');

test('pente captures during the swap2 drops are credited to the colour that made them', () => {
  const pos = capturedInOpening();
  expect(keys(pos.stones.keys())).toEqual(new Set(['h9', 'h6']));
  expect(pos.captures).toEqual({ p1: 0, p2: 2 });
  expect(pos.openingStep).toBe('s');
  expect(pos.nextColour()).toBe('b-piece');
  expect(pos.turn).toBe('p2');
});

test('pente still reaches the final choice on the fifth stone dropped, the captures swapping with the colours', () => {
  const pos = play(capturedInOpening(), 'B@a1');
  expect(pos.openingStep).toBe('f');
  expect(pos.blackSeat).toBe('p2');
  expect(pos.captures).toEqual({ p1: 2, p2: 0 });
  expect(pos.turn).toBe('p1');
});

// nine spare black stones balance the eight white stones black has already captured
const eightTaken = () => {
  const spares = black('s1', 's3', 's5', 's7', 's9', 's11', 's13', 's15', 's17');
  const board = position([...spares, ...black('a1'), ...white('b1', 'c1')]);
  return read(fen(board).replace(' w 1 - 0 0 ', ' b 1 - 8 0 '));
};

test('pente is won by the seat that captures its tenth stone', () => {
  const pos = eightTaken();
  expect(pos.isEnd()).toBe(false);
  const after = dropNext(pos, 'd1');
  expect(after.captures).toEqual({ p1: 10, p2: 0 });
  expect(after.isEnd()).toBe(true);
  expect(after.outcome()).toEqual({ winner: 'p1' });
  expect(after.emptyPoints()).toEqual([]);
});

test('pente captures follow the colour through a swap', () => {
  const after = dropNext(eightTaken(), 'd1');
  const swapped = read(fen(after).replace(' w 1 - 10 0 ', ' w 2 - 0 10 '));
  expect(swapped.outcome()).toEqual({ winner: 'p2' });
});

test('pente is still won by five or more in a row, and not by fewer than ten captured', () => {
  const line = position(white('o15', 'p15', 'q15', 'r15', 's15', 'n15'));
  expect(line.outcome()).toEqual({ winner: 'p2' });
  expect(read(initialFen.replace(' o 0 0 ', ' - 8 8 ')).isEnd()).toBe(false);
});

test("pente fen records each seat's captures", () => {
  expect(stateFields(rowCaptured())).toBe('w 1 - 2 0 1');
});

test('pente fen round trips with the captures, the seat and the turn', () => {
  const pos = play(capturedInOpening(), 'B@a1', 'W@s19');
  const back = read(fen(pos));
  expect(fen(back)).toBe(fen(pos));
  expect(back.captures).toEqual(pos.captures);
  expect(back.blackSeat).toBe(pos.blackSeat);
  expect(back.turn).toBe(pos.turn);
});

test('pente and gomoku fens are not read as each other', () => {
  expect(parseFen('gomoku')(initialFen).isErr).toBe(true);
  expect(parseFen('pente')(Gomoku.getInitialFen('p1')).isErr).toBe(true);
  expect(parseFen('pente')(initialFen.replace(' o 0 0 ', ' p 0 0 ')).isErr).toBe(true);
});

test('pente refuses a next colour the stones and captures contradict', () => {
  const empty18 = Array(18).fill('19').join('/');
  expect(parseFen('pente')(`${empty18}/BW17 b 1 - 0 0 1`).isOk).toBe(true);
  expect(parseFen('pente')(`${empty18}/BW17 w 1 - 0 0 1`).isErr).toBe(true);
  // black has captured two white stones, so one black and two white have been dropped
  expect(parseFen('pente')(`${empty18}/B18 w 1 - 2 0 1`).isOk).toBe(true);
  expect(parseFen('pente')(`${empty18}/B18 b 1 - 2 0 1`).isErr).toBe(true);
});

test("pente reports each seat's captures as its score", () => {
  const after = fen(rowCaptured());
  expect(Pente.getScoreFromFen(after, 'p1')).toBe(2);
  expect(Pente.getScoreFromFen(after, 'p2')).toBe(0);
});
