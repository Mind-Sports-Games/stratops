import { expect, test } from '@jest/globals';
import { makeFen, parseFen } from '../../fen';
import { parseSquare, parseUci } from '../../util';
import { GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { gameFamilyClass, variantClass, variantClassFromKey } from '../util';
import { GameFamily } from './GameFamily';
import { Gomoku } from './Gomoku';

const initialFen = `${Array(15).fill('15').join('/')} b 1 o 1`;

const start = (): GameFamily => Gomoku.fromSetup(parseFen('gomoku')(initialFen).unwrap()).unwrap();

const play = (pos: GameFamily, ...actions: string[]): GameFamily => {
  const next = pos.clone();
  for (const action of actions) {
    if (action === 'swap') {
      if (!next.canSwap()) throw new Error(`illegal ${action}`);
      next.swap();
    } else if (action === 'swap2') {
      if (!next.canSwap2()) throw new Error(`illegal ${action}`);
      next.swap2();
    } else {
      const move = parseUci('gomoku')(action);
      if (!move || !next.isLegal(move)) throw new Error(`illegal ${action}`);
      next.play(move);
    }
  }
  return next;
};

const refused = (pos: GameFamily, action: string): boolean => {
  try {
    play(pos, action);
    return false;
  } catch {
    return true;
  }
};

const fen = (pos: GameFamily): string => makeFen('gomoku')(pos.toSetup());
const stateFields = (pos: GameFamily): string => fen(pos).split(' ').slice(1).join(' ');
const ownerAt = (pos: GameFamily, key: string) => pos.stoneAt(parseSquare('gomoku')(key)!)?.playerIndex;

const opened = play(start(), 'B@h8', 'W@h9', 'B@i8');

test('gomoku is wired as the five in a row game family with a single variant', () => {
  expect(variantClass('gomoku')).toBe(Gomoku);
  expect(variantClassFromKey(VariantKey.gomoku)).toBe(Gomoku);
  expect(gameFamilyClass(GameFamilyKey.fiveinarow).getVariantKeys()).toEqual([VariantKey.gomoku]);
  expect(Gomoku.family).toBe(GameFamilyKey.fiveinarow);
  expect(Gomoku.getBoardDimensions()).toEqual({ files: 15, ranks: 15 });
  expect(Gomoku.getNotationStyle()).toBe(NotationStyle.uci);
  expect(Gomoku.playerColors).toEqual({ p1: 'black', p2: 'white' });
});

test('gomoku initial fen matches strategygames', () => {
  expect(Gomoku.getInitialFen('p1')).toBe(initialFen);
  expect(Gomoku.getInitialFen('p2')).toBe(initialFen);
  expect(fen(Gomoku.default())).toBe(initialFen);
});

test('gomoku initial fen parses to an empty position with P1 to drop black', () => {
  const pos = start();
  expect(pos.stones.size).toBe(0);
  expect(pos.turn).toBe('p1');
  expect(pos.blackSeat).toBe('p1');
  expect(pos.openingStep).toBe('o');
  expect(pos.nextColour()).toBe('b-piece');
});

test('gomoku rejects a fen whose turn disagrees with the stones', () => {
  expect(parseFen('gomoku')(initialFen.replace(' b 1 o', ' w 1 o')).isErr).toBe(true);
  expect(parseFen('gomoku')(initialFen.replace(' 1 o', ' 3 o')).isErr).toBe(true);
  expect(parseFen('gomoku')(initialFen.replace(' o 1', ' x 1')).isErr).toBe(true);
  expect(parseFen('gomoku')(`${Array(15).fill('15').join('/')} w - - 0 1`).isErr).toBe(true);
});

test('gomoku fen names stones by colour and gives each to the seat holding it', () => {
  expect(stateFields(opened)).toBe('w 1 c 1');
  expect(fen(opened).split(' ')[0].split('/')[7]).toBe('7BB6');

  const setup = parseFen('gomoku')(fen(play(opened, 'swap'))).unwrap();
  expect(setup.blackSeat).toBe('p2');
  expect(setup.turn).toBe('p1');
  const read = Gomoku.fromSetup(setup).unwrap();
  expect(read.stoneAt(parseSquare('gomoku')('h8')!)).toEqual({ role: 'b-piece', playerIndex: 'p2' });
  expect(read.stoneAt(parseSquare('gomoku')('h9')!)).toEqual({ role: 'w-piece', playerIndex: 'p1' });
});

test('gomoku fen round trips at every step of the opening', () => {
  const positions = [
    start(),
    play(start(), 'B@h8'),
    opened,
    play(opened, 'swap'),
    play(opened, 'W@j8'),
    play(opened, 'swap2'),
    play(opened, 'swap2', 'W@j8'),
    play(opened, 'swap2', 'W@j8', 'B@j9'),
    play(opened, 'swap2', 'W@j8', 'B@j9', 'swap'),
    play(opened, 'swap2', 'W@j8', 'B@j9', 'W@k8'),
  ];
  for (const pos of positions) {
    const read = Gomoku.fromSetup(parseFen('gomoku')(fen(pos)).unwrap()).unwrap();
    expect(fen(read)).toBe(fen(pos));
    expect(read.turn).toBe(pos.turn);
  }
});

test('gomoku reads and writes the far corner of the board', () => {
  const pos = play(start(), 'B@o15');
  expect(fen(pos).split(' ')[0].split('/')[0]).toBe('14B');
  expect(ownerAt(Gomoku.fromSetup(parseFen('gomoku')(fen(pos)).unwrap()).unwrap(), 'o15')).toBe('p1');
});

test('gomoku opening makes P1 drop black, white, black in that order', () => {
  expect(refused(start(), 'W@h8')).toBe(true);
  const one = play(start(), 'B@h8');
  expect(one.turn).toBe('p1');
  expect(refused(one, 'B@h9')).toBe(true);
  expect(ownerAt(opened, 'h9')).toBe('p2');
  expect(opened.turn).toBe('p2');
  expect(opened.openingStep).toBe('c');
});

test('gomoku offers neither swap during the opening drops', () => {
  expect(start().canSwap()).toBe(false);
  expect(start().canSwap2()).toBe(false);
});

test('gomoku P2 continuing with a drop leaves the opening for good', () => {
  const pos = play(opened, 'W@j8');
  expect(pos.turn).toBe('p1');
  expect(pos.blackSeat).toBe('p1');
  expect(pos.openingStep).toBe('-');
  expect(pos.canSwap()).toBe(false);
});

test('gomoku swap gives P2 black without changing the board', () => {
  const pos = play(opened, 'swap');
  expect(pos.blackSeat).toBe('p2');
  expect(pos.turn).toBe('p1');
  expect(pos.nextColour()).toBe('w-piece');
  expect(ownerAt(pos, 'h8')).toBe('p2');
  expect(fen(pos).split(' ')[0]).toBe(fen(opened).split(' ')[0]);
  expect(stateFields(pos)).toBe('w 2 - 2');
  expect(pos.canSwap()).toBe(false);
});

test('gomoku swap2 keeps P2 on the move for a white then a black stone, then exchanges colours', () => {
  const declared = play(opened, 'swap2');
  expect(declared.turn).toBe('p2');
  expect(declared.openingStep).toBe('s');
  expect(refused(declared, 'B@j8')).toBe(true);
  expect(stateFields(play(declared, 'W@j8'))).toBe('b 1 s 1');

  const pos = play(declared, 'W@j8', 'B@j9');
  expect(stateFields(pos)).toBe('w 2 f 2');
  expect(pos.turn).toBe('p1');
  expect(pos.canSwap()).toBe(true);
  expect(pos.canSwap2()).toBe(false);

  const swappedBack = play(pos, 'swap');
  expect(swappedBack.blackSeat).toBe('p1');
  expect(swappedBack.turn).toBe('p2');

  const continued = play(pos, 'W@k8');
  expect(continued.blackSeat).toBe('p2');
  expect(continued.turn).toBe('p2');
  expect(continued.openingStep).toBe('-');
});

test('gomoku refuses an occupied point and offers only empty points', () => {
  const pos = play(opened, 'W@j8');
  expect(refused(pos, 'B@h8')).toBe(true);
  expect(pos.emptyPoints().length).toBe(225 - 4);
  expect(pos.dests(parseSquare('gomoku')('h8')!).isEmpty()).toBe(true);
});

// the same record as strategygames' FiveInARowFullGameTest
const record = [
  ['B@h8', 'W@h9', 'B@i8'],
  ['swap2', 'W@j9', 'B@g8'],
  ['W@j8'],
  ['B@f8'],
  ['W@e8'],
  ['B@g7'],
  ['W@k10'],
  ['B@g9'],
  ['W@g10'],
  ['B@g6'],
  ['W@g5'],
  ['B@i7'],
  ['W@h6'],
  ['B@c12'],
  ['W@d12'],
  ['B@f6'],
  ['W@l11'],
  ['B@i9'],
  ['W@j10'],
  ['B@e5'],
];
const actions = record.flat();
const after = (n: number) => play(start(), ...actions.slice(0, n));

test('gomoku full game passes through each step of the opening', () => {
  expect(stateFields(after(3))).toBe('w 1 c 1');
  expect(after(3).turn).toBe('p2');
  expect(stateFields(after(6))).toBe('w 2 f 2');
  expect(after(6).turn).toBe('p1');
  expect(stateFields(after(7))).toBe('b 2 - 2');
  expect(after(7).turn).toBe('p2');
});

test('gomoku full game does not end on fours that were closed in time', () => {
  const pos = after(actions.length - 1);
  expect(pos.isEnd()).toBe(false);
  expect(pos.outcome()).toBeUndefined();
  expect(pos.turn).toBe('p2');
});

test('gomoku full game ends on the fifth stone, won by the seat holding black', () => {
  const finished = after(actions.length);
  expect(finished.blackSeat).toBe('p2');
  expect(finished.isEnd()).toBe(true);
  expect(finished.outcome()).toEqual({ winner: 'p2' });
  expect(finished.emptyPoints()).toEqual([]);
  expect(finished.canSwap()).toBe(false);
  expect(refused(finished, 'W@a1')).toBe(true);
  expect(stateFields(finished)).toBe('w 2 - 11');

  const read = Gomoku.fromSetup(parseFen('gomoku')(fen(finished)).unwrap()).unwrap();
  expect(read.outcome()).toEqual({ winner: 'p2' });
});

test('gomoku an overline still wins', () => {
  const board = '15/15/15/15/15/15/15/BBBBBB9/WWWW11/15/15/15/15/15/15';
  const pos = Gomoku.fromSetup(parseFen('gomoku')(`${board} w 1 - 6`).unwrap()).unwrap();
  expect(pos.outcome()).toEqual({ winner: 'p1' });
});

test('gomoku a line of four does not end the game', () => {
  const board = '15/15/15/15/15/15/15/BBBB11/WWWW11/15/15/15/15/15/15';
  const pos = Gomoku.fromSetup(parseFen('gomoku')(`${board} b 1 - 5`).unwrap()).unwrap();
  expect(pos.isEnd()).toBe(false);
  const won = play(pos, 'B@e8');
  expect(won.outcome()).toEqual({ winner: 'p1' });
});

test('gomoku diagonal lines win in both directions', () => {
  const rising = play(start(), 'B@a1', 'W@a15', 'B@b2');
  const pos = play(rising, 'W@b15', 'B@c3', 'W@c15', 'B@d4', 'W@d15', 'B@e5');
  expect(pos.outcome()).toEqual({ winner: 'p1' });

  const falling = play(start(), 'B@a5', 'W@o1', 'B@b4');
  const pos2 = play(falling, 'W@o2', 'B@c3', 'W@o3', 'B@d2', 'W@o4', 'B@e1');
  expect(pos2.outcome()).toEqual({ winner: 'p1' });
});

const notation = (uci: string) => Gomoku.computeMoveNotation({ san: '', uci, fen: '', prevFen: '' });

test('gomoku notation is the point for a drop and the action name otherwise', () => {
  expect(notation('B@h8')).toBe('h8');
  expect(notation('W@o15')).toBe('o15');
  expect(notation('swap')).toBe('swap');
  expect(notation('swap2')).toBe('swap2');
  expect(Gomoku.combinedNotation(['h8', 'h9', 'i8'])).toBe('h8 h9 i8');
});

test('gomoku lexical uci reads drops and skips swaps', () => {
  expect(Gomoku.parseLexicalUci('W@o15')).toEqual({ from: 'o15', to: 'o15', dropRole: 'w-piece' });
  expect(Gomoku.parseLexicalUci('swap')).toBeUndefined();
  expect(Gomoku.parseLexicalUci('swap2')).toBeUndefined();
});

test('gomoku pieces coordinates follow the black seat', () => {
  const swappedFen = fen(play(opened, 'swap'));
  expect(Gomoku.getPiecesCoordinates(swappedFen, 'p1')).toEqual([{ piece: 'W', coord: 'h9' }]);
  expect(Gomoku.getPiecesCoordinates(swappedFen, 'p2')).toEqual([
    { piece: 'B', coord: 'h8' },
    { piece: 'B', coord: 'i8' },
  ]);
});
