import { parseUci } from './util.js';
import { parseFen } from './fen.js';
import { Chess } from './chess.js';
import { chessgroundDests, scalachessCharPair } from './compat.js';
import { expect, test } from '@jest/globals';

test('chessground dests with Kh8', () => {
  const setup = parseFen('chess')('r1bq1r2/3n2k1/p1p1pp2/3pP2P/8/PPNB2Q1/2P2P2/R3K3 b Q - 1 22').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  const dests = chessgroundDests('chess')(pos);
  expect(dests.get('g7')).toContain('h8');
  expect(dests.get('g7')).not.toContain('g8');
});

test('chessground dests with chess960 castle', () => {
  const setup = parseFen('chess')('rk2r3/pppbnppp/3p2n1/P2Pp3/4P2q/R5NP/1PP2PP1/1KNQRB2 b Kkq - 0 1').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  expect(chessgroundDests('chess')(pos).get('b8')).toEqual(['a8', 'c8', 'e8']);
});

test('uci char pair', () => {
  const charPair = scalachessCharPair('chess');
  const uci = parseUci('chess');
  // regular moves
  expect(charPair(uci('a1b1')!)).toBe('#$');
  expect(charPair(uci('a1a2')!)).toBe('#+');
  expect(charPair(uci('h7h8')!)).toBe('Zb');

  // promotions
  expect(charPair(uci('b7b8q')!)).toBe('Td');
  expect(charPair(uci('b7c8q')!)).toBe('Te');
  expect(charPair(uci('b7c8n')!)).toBe('T}');

  // drops
  expect(charPair(uci('P@a1')!)).toBe('#\x8f');
  expect(charPair(uci('Q@h8')!)).toBe('b\x8b');
});
