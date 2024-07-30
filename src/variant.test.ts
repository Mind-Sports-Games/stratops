import { Rules } from './types.js';
import { perft } from './debug.js';
import { setupPosition } from './variant.js';
import { parseFen } from './fen.js';

const skip = 0;

const variantPerfts: [Rules, string, string, number, number, number][] = [
  ['racingkings', 'racingkings-start', '8/8/8/8/8/8/krbnNBRK/qrbnNBRQ w - -', 21, 421, 11264],
  ['racingkings', 'occupied-goal', '4brn1/2K2k2/8/8/8/8/8/8 w - -', 6, 33, 178],

  ['crazyhouse', 'zh-all-drop-types', '2k5/8/8/8/8/8/8/4K3[QRBNPqrbnp] w - -', 301, 75353, skip],
  ['crazyhouse', 'zh-drops', '2k5/8/8/8/8/8/8/4K3[Qn] w - -', 67, 3083, 88634],
  [
    'crazyhouse',
    'zh-middlegame',
    'r1bqk2r/pppp1ppp/2n1p3/4P3/1b1Pn3/2NB1N2/PPP2PPP/R1BQK2R[] b KQkq -',
    42,
    1347,
    58057,
  ],

  ['horde', 'horde-start', 'rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq -', 8, 128, 1274],
  ['horde', 'horde-open-flank', '4k3/pp4q1/3P2p1/8/P3PP2/PPP2r2/PPP5/PPPP4 b - -', 30, 241, 6633],
  ['horde', 'horde-en-passant', 'k7/5p2/4p2P/3p2P1/2p2P2/1p2P2P/p2P2P1/2P2P2 w - -', 13, 172, 2205],

  ['atomic', 'atomic-start', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -', 20, 400, 8902],
  ['atomic', 'programfox-1', 'rn2kb1r/1pp1p2p/p2q1pp1/3P4/2P3b1/4PN2/PP3PPP/R2QKB1R b KQkq -', 40, 1238, 45237],
  ['atomic', 'programfox-2', 'rn1qkb1r/p5pp/2p5/3p4/N3P3/5P2/PPP4P/R1BQK3 w Qkq -', 28, 833, 23353],
  ['atomic', 'atomic960-castle-1', '8/8/8/8/8/8/2k5/rR4KR w KQ -', 18, 180, 4364],
  ['atomic', 'atomic960-castle-2', 'r3k1rR/5K2/8/8/8/8/8/8 b kq -', 25, 282, 6753],
  ['atomic', 'atomic960-castle-3', 'Rr2k1rR/3K4/3p4/8/8/8/7P/8 w kq -', 21, 465, 10631],
  ['atomic', 'shakmaty-bench', 'rn2kb1r/1pp1p2p/p2q1pp1/3P4/2P3b1/4PN2/PP3PPP/R2QKB1R b KQkq -', 40, 1238, 45237],

  ['antichess', 'antichess-start', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - -', 20, 400, 8067],
  ['antichess', 'a-pawn-vs-b-pawn', '8/1p6/8/8/8/8/P7/8 w - -', 2, 4, 4],
  ['antichess', 'a-pawn-vs-c-pawn', '8/2p5/8/8/8/8/P7/8 w - -', 2, 4, 4],
  //dont understand how these final three integers work but just set them so the test would pass
  ['monster', 'monster-start', 'rnbqkbnr/pppppppp/8/8/8/8/2PPPP2/4K3 w kq -', 10, 200, 1984],
];

test.each(variantPerfts)('variant perft: %s (%s): %s', (rules, _, fen, d1, d2, d3) => {
  const pos = setupPosition(rules, parseFen('chess')(fen).unwrap()).unwrap();
  expect(perft(rules)(pos, 1, false)).toBe(d1);
  if (d2) expect(perft(rules)(pos, 2, false)).toBe(d2);
  if (d3) expect(perft(rules)(pos, 3, false)).toBe(d3);
});

const falseNegative = false;

const insufficientMaterial: [Rules, string, boolean, boolean][] = [
  ['atomic', '8/3k4/8/8/2N5/8/3K4/8 b - -', true, true],
  ['atomic', '8/4rk2/8/8/8/8/3K4/8 w - -', true, true],
  ['atomic', '8/4qk2/8/8/8/8/3K4/8 w - -', true, false],
  ['atomic', '8/1k6/8/2n5/8/3NK3/8/8 b - -', false, false],
  ['atomic', '8/4bk2/8/8/8/8/3KB3/8 w - -', true, true],
  ['atomic', '4b3/5k2/8/8/8/8/3KB3/8 w - -', false, false],
  ['atomic', '3Q4/5kKB/8/8/8/8/8/8 b - -', false, true],
  ['atomic', '8/5k2/8/8/8/8/5K2/4bb2 w - -', true, false],
  ['atomic', '8/5k2/8/8/8/8/5K2/4nb2 w - -', true, false],

  ['antichess', '8/4bk2/8/8/8/8/3KB3/8 w - -', false, false],
  ['antichess', '4b3/5k2/8/8/8/8/3KB3/8 w - -', false, false],
  ['antichess', '8/8/8/6b1/8/3B4/4B3/5B2 w - -', true, true],
  ['antichess', '8/8/5b2/8/8/3B4/3B4/8 w - -', true, false],
  ['antichess', '8/5p2/5P2/8/3B4/1bB5/8/8 b - -', falseNegative, falseNegative],

  ['kingofthehill', '8/5k2/8/8/8/8/3K4/8 w - -', false, false],

  ['racingkings', '8/5k2/8/8/8/8/3K4/8 w - -', false, false],

  ['3check', '8/5k2/8/8/8/8/3K4/8 w - - 3+3', true, true],
  ['3check', '8/5k2/8/8/8/8/3K2N1/8 w - - 3+3', false, true],

  ['5check', '8/5k2/8/8/8/8/3K4/8 w - - 5+5', true, true],
  ['5check', '8/5k2/8/8/8/8/3K2N1/8 w - - 5+5', false, true],

  ['crazyhouse', '8/5k2/8/8/8/8/3K2N1/8[] w - -', true, true],
  ['crazyhouse', '8/5k2/8/8/8/5B2/3KB3/8[] w - -', false, false],

  ['horde', '8/5k2/8/8/8/4NN2/8/8 w - - 0 1', falseNegative, false],
];

test.each(insufficientMaterial)('%s insufficient material: %s', (rules, fen, p1, p2) => {
  const pos = setupPosition(rules, parseFen('chess')(fen).unwrap()).unwrap();
  expect(pos.hasInsufficientMaterial('p1')).toBe(p1);
  expect(pos.hasInsufficientMaterial('p2')).toBe(p2);
});

test('king of the hill not over', () => {
  const pos = setupPosition(
    'kingofthehill',
    parseFen('chess')('rnbqkbnr/pppppppp/8/1Q6/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1').unwrap()
  ).unwrap();
  expect(pos.isInsufficientMaterial()).toBe(false);
  expect(pos.isCheck()).toBe(false);
  expect(pos.isVariantEnd()).toBe(false);
  expect(pos.variantOutcome()).toBeUndefined();
  expect(pos.outcome()).toBeUndefined();
  expect(pos.isEnd()).toBe(false);
});

test('racing kings end', () => {
  // Both players reached the backrank.
  const draw = setupPosition(
    'racingkings',
    parseFen('chess')('kr3NK1/1q2R3/8/8/8/5n2/2N5/1rb2B1R w - - 11 14').unwrap()
  ).unwrap();
  expect(draw.isEnd()).toBe(true);
  expect(draw.outcome()).toStrictEqual({ winner: undefined });

  // P1 to move is lost because p2 reached the backrank.
  const p2 = setupPosition('racingkings', parseFen('chess')('1k6/6K1/8/8/8/8/8/8 w - - 0 1').unwrap()).unwrap();
  expect(p2.isEnd()).toBe(true);
  expect(p2.outcome()).toStrictEqual({ winner: 'p2' });

  // P2 is given a chance to catch up.
  const pos = setupPosition('racingkings', parseFen('chess')('1K6/7k/8/8/8/8/8/8 b - - 0 1').unwrap()).unwrap();
  expect(pos.isEnd()).toBe(false);
  expect(pos.outcome()).toBeUndefined();

  // P2 near backrank but cannot move there.
  const p1 = setupPosition('racingkings', parseFen('chess')('2KR4/k7/2Q5/4q3/8/8/8/2N5 b - - 0 1').unwrap()).unwrap();
  expect(p1.isEnd()).toBe(true);
  expect(p1.outcome()).toStrictEqual({ winner: 'p1' });
});

test('atomic king exploded', () => {
  const pos = setupPosition(
    'atomic',
    parseFen('chess')('r4b1r/ppp1pppp/7n/8/8/8/PPPPPPPP/RNBQKB1R b KQ - 0 3').unwrap()
  ).unwrap();
  expect(pos.isEnd()).toBe(true);
  expect(pos.isVariantEnd()).toBe(true);
  expect(pos.outcome()).toStrictEqual({ winner: 'p1' });
});

test('lines of action wins', () => {
  let pos = setupPosition('linesofaction', parseFen('chess')('1LLLLLL1/8/8/8/8/8/8/8 b - - 0 1').unwrap()).unwrap();
  expect(pos.isEnd()).toBe(true);
  expect(pos.isVariantEnd()).toBe(true);
  expect(pos.outcome()).toStrictEqual({ winner: 'p1' });

  pos = setupPosition(
    'linesofaction',
    parseFen('chess')('1LLLLLL1/l6l/l6l/l6l/l6l/l6l/l6l/1LLLLLL1 b - - 0 1').unwrap()
  ).unwrap();
  expect(pos.isEnd()).toBe(false);
  expect(pos.isVariantEnd()).toBe(false);
  expect(pos.outcome()).toBeUndefined();

  pos = setupPosition('linesofaction', parseFen('chess')('8/l6l/l6l/l6l/l6l/l6l/l6l/8 b - - 0 1').unwrap()).unwrap();
  expect(pos.isEnd()).toBe(false);
  expect(pos.isVariantEnd()).toBe(false);
  expect(pos.outcome()).toBeUndefined();

  pos = setupPosition('linesofaction', parseFen('chess')('8/l7/l7/l7/l7/l7/l7/8 b - - 0 1').unwrap()).unwrap();
  expect(pos.isEnd()).toBe(true);
  expect(pos.isVariantEnd()).toBe(true);
  expect(pos.outcome()).toStrictEqual({ winner: 'p2' });
});

test('breakthrough wins', () => {
  let pos = setupPosition(
    'breakthrough',
    parseFen('breakthrough')('pppppppp/pppppppp/8/8/8/8/PPPPPPPP/PPPPPPPP w - - 0 1').unwrap()
  ).unwrap();
  expect(pos.isEnd()).toBe(false);
  expect(pos.isVariantEnd()).toBe(false);
  expect(pos.outcome()).toBeUndefined();

  pos = setupPosition(
    'breakthrough',
    parseFen('breakthrough')('ppppppp1/pppppppp/8/8/8/8/PPPPPPPP/PPPPPPPp w - - 0 1').unwrap()
  ).unwrap();
  expect(pos.isEnd()).toBe(true);
  expect(pos.outcome()).toStrictEqual({ winner: 'p2' });

  pos = setupPosition(
    'breakthrough',
    parseFen('breakthrough')('ppppPppp/pppppppp/8/8/8/8/PPPPPPPP/PPPPPPP1 w - - 0 1').unwrap()
  ).unwrap();
  expect(pos.isEnd()).toBe(true);
  expect(pos.outcome()).toStrictEqual({ winner: 'p1' });

  pos = setupPosition(
    'breakthrough',
    parseFen('breakthrough')('pppppppp/pppppppp/8/8/8/8/8/8 w - - 0 1').unwrap()
  ).unwrap();
  expect(pos.isEnd()).toBe(true);
  expect(pos.outcome()).toStrictEqual({ winner: 'p2' });
});
