import { expect, test } from '@jest/globals';
import { makeFen, parseFen } from '../../fen';
import { makeSanAndPlay } from '../../san';
import { parseUci } from '../../util';
import { variantClass } from '../util';

const puzzleFen = 'rnbqkbnr/ppp1pppp/8/3p4/Q7/2P5/PP1PPPPP/RNB1KBNR b KQkq - 1 2 +1+0';

const position = (rules: '3check' | '5check', fen: string) =>
  variantClass(rules).fromSetup(parseFen(rules)(fen).unwrap()).unwrap();

test('three-check reads checks given in the strategygames format', () => {
  const setup = parseFen('3check')(puzzleFen).unwrap();
  expect(setup.remainingChecks?.p1).toBe(2);
  expect(setup.remainingChecks?.p2).toBe(3);
});

test('five-check reads checks given against five', () => {
  const setup = parseFen('5check')(puzzleFen.replace('+1+0', '+4+0')).unwrap();
  expect(setup.remainingChecks?.p1).toBe(1);
  expect(setup.remainingChecks?.p2).toBe(5);
});

test('three-check rejects more checks given than it takes to win', () => {
  expect(parseFen('3check')(puzzleFen.replace('+1+0', '+4+0')).isErr).toBe(true);
});

test('remaining-checks notation before the move counters still parses', () => {
  const setup = parseFen('3check')('8/5k2/8/8/8/8/3K4/8 w - - 2+3 0 1').unwrap();
  expect(setup.remainingChecks?.p1).toBe(2);
  expect(setup.remainingChecks?.p2).toBe(3);
});

test('three-check fen round-trips in the strategygames format', () => {
  expect(makeFen('3check')(position('3check', puzzleFen).toSetup())).toBe(puzzleFen);
});

test('five-check fen round-trips in the strategygames format', () => {
  const fen = puzzleFen.replace('+1+0', '+4+2');
  expect(makeFen('5check')(position('5check', fen).toSetup())).toBe(fen);
});

test('three-check counts each check and the third check wins', () => {
  const pos = position('3check', puzzleFen);
  const sans = ['b7b5', 'a4b5', 'b8c6', 'b5c6'].map(uci => makeSanAndPlay('3check')(pos, parseUci('3check')(uci)!));
  expect(sans).toEqual(['b5', 'Qxb5+', 'Nc6', 'Qxc6#']);
  expect(makeFen('3check')(pos.toSetup())).toBe('r1bqkbnr/p1p1pppp/2Q5/3p4/8/2P5/PP1PPPPP/RNB1KBNR b KQkq - 0 4 +3+0');
  expect(pos.outcome()).toEqual({ winner: 'p1' });
  expect(pos.isEnd()).toBe(true);
});

test('a move that gives no check leaves the count alone', () => {
  const pos = position('3check', puzzleFen);
  pos.play(parseUci('3check')('b7b5')!);
  expect(pos.remainingChecks?.p1).toBe(2);
  expect(pos.remainingChecks?.p2).toBe(3);
});
