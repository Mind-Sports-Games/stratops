import { expect, test } from '@jest/globals';
import { parseFen } from '../../fen';
import { VariantKey } from '../types';
import { variantClass, variantClassFromKey } from '../util';
import { isForbidden } from './forbidden';
import type { GameFamily } from './GameFamily';
import { Gomoku } from './Gomoku';
import { Renju } from './Renju';
import { black, fiveInARowSupport, white } from './testSupport';

const { square, keys, play, refused, fen, stateFields, read, position, dropNext } = fiveInARowSupport(Renju);

const initialFen = `${Array(15).fill('15').join('/')} b 1 p 1`;
const start = () => read(initialFen);
const drops = (pos: GameFamily) => keys(pos.emptyPoints());

// white stones spaced along the edges, enough to make it black's turn without lines of their own
const spareWhites = [
  'a1',
  'c1',
  'e1',
  'g1',
  'i1',
  'k1',
  'm1',
  'o1',
  'a15',
  'c15',
  'e15',
  'g15',
  'i15',
  'k15',
  'm15',
  'o15',
];

const blackToMove = (blacks: string[], whites: string[] = []): GameFamily => {
  const spares = spareWhites.filter(key => !whites.includes(key)).slice(0, blacks.length - whites.length);
  return position([...black(...blacks), ...white(...whites, ...spares)]);
};

const forbidden = (pos: GameFamily, key: string): boolean =>
  isForbidden({ stones: pos.stones, width: 15, height: 15 }, square(key));

// a four stone opening symmetric about the h file
const fourOnTheHFile = () => play(start(), 'B@h8', 'W@h9', 'B@h10', 'W@h11');

test('renju is wired as a 15x15 five in a row variant', () => {
  expect(variantClass('renju')).toBe(Renju);
  expect(variantClassFromKey(VariantKey.renju)).toBe(Renju);
  expect(Renju.getBoardDimensions()).toEqual({ files: 15, ranks: 15 });
});

test('renju starts from the empty board in the placing step', () => {
  expect(Renju.getInitialFen('p1')).toBe(initialFen);
  expect(fen(Renju.default())).toBe(initialFen);
  expect(parseFen('renju')(initialFen.replace(' p ', ' o ')).isErr).toBe(true);
  expect(parseFen('gomoku')(initialFen).isErr).toBe(true);
});

test('renju taraguchi puts the first stone on the centre', () => {
  expect(drops(start())).toEqual(new Set(['h8']));
  expect(refused(start(), 'B@g8')).toBe(true);
  expect(start().canSwap()).toBe(false);
  expect(start().canSwap2()).toBe(false);
});

test('renju taraguchi widens the square about the centre by one for each of the first five stones', () => {
  const one = play(start(), 'B@h8');
  const two = play(one, 'W@h9');
  const three = play(two, 'B@i9');
  const four = play(three, 'W@g7');
  expect(drops(one).size).toBe(8);
  expect(drops(two).size).toBe(23);
  expect(drops(three).size).toBe(46);
  expect(drops(four).size).toBe(77);
  expect(refused(one, 'W@h10')).toBe(true);
  expect(refused(four, 'B@m8')).toBe(true);
  expect(refused(four, 'B@l8')).toBe(false);
});

test('renju offers the player to move a swap after each of the first five stones', () => {
  const one = play(start(), 'B@h8');
  expect(one.openingStep).toBe('q');
  expect(one.turn).toBe('p2');
  expect(one.canSwap()).toBe(true);
});

test('renju hands the next stone to the other seat after a swap, and offers no second swap', () => {
  const swapped = play(start(), 'B@h8', 'swap');
  expect(swapped.blackSeat).toBe('p2');
  expect(swapped.turn).toBe('p1');
  expect(swapped.nextColour()).toBe('w-piece');
  expect(swapped.canSwap()).toBe(false);
  expect(swapped.openingStep).toBe('p');
  expect(play(swapped, 'W@h9').canSwap()).toBe(true);
});

test('renju takes the swap after the fourth stone before black chooses', () => {
  const four = play(start(), 'B@h8', 'W@h9', 'B@i9', 'W@g7');
  expect(four.canSwap()).toBe(true);
  expect(four.canOffer10()).toBe(true);
  const swapped = play(four, 'swap');
  expect(swapped.canSwap()).toBe(false);
  expect(swapped.canOffer10()).toBe(true);
  expect(swapped.turn).toBe('p2');
});

test('renju on choice 1 offers a swap after the fifth and frees the sixth', () => {
  const five = play(start(), 'B@h8', 'W@h9', 'B@i9', 'W@g7', 'B@j10');
  expect(five.canSwap()).toBe(true);
  expect(five.canOffer10()).toBe(false);
  expect(drops(five).size).toBe(225 - 5);
  const six = play(five, 'W@a1');
  expect(six.openingStep).toBe('-');
  expect(six.canSwap()).toBe(false);
});

test('renju offers ten fifth stones only after the fourth', () => {
  expect(play(start(), 'B@h8').canOffer10()).toBe(false);
  expect(refused(play(start(), 'B@h8', 'W@h9', 'B@i9'), 'offer10')).toBe(true);
  expect(Gomoku.default().canOffer10()).toBe(false);
});

const offering = () => play(fourOnTheHFile(), 'offer10');

test('renju offer10 keeps the turn with black, who drops anywhere', () => {
  const pos = offering();
  expect(pos.openingStep).toBe('x');
  expect(pos.turn).toBe('p1');
  expect(refused(pos, 'swap')).toBe(true);
  expect(drops(pos).has('a1')).toBe(true);
});

test('renju offered stones stay off the board', () => {
  const pos = play(offering(), 'B@a1');
  expect(pos.stones.size).toBe(4);
  expect(keys(pos.offeredPoints())).toEqual(new Set(['a1']));
  expect(pos.turn).toBe('p1');
  expect(pos.nextColour()).toBe('b-piece');
});

test('renju refuses an offered stone symmetrical to one already offered', () => {
  const pos = play(offering(), 'B@g5');
  expect(refused(pos, 'B@i5')).toBe(true);
  expect(refused(pos, 'B@g5')).toBe(true);
  expect(refused(pos, 'B@h5')).toBe(false);
  expect(drops(pos).has('i5')).toBe(false);
});

test('renju allows mirror-image offered stones when the position has no symmetry', () => {
  const asymmetric = play(start(), 'B@h8', 'W@h9', 'B@i9', 'W@g7', 'offer10', 'B@g5');
  expect(refused(asymmetric, 'B@i5')).toBe(false);
});

const ten = ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'a2', 'b2', 'c2'].map(key => `B@${key}`);
const offered = () => play(offering(), ...ten);

test('renju passes to white once ten are offered, with only the offered points to drop on', () => {
  const pos = offered();
  expect(pos.openingStep).toBe('k');
  expect(pos.turn).toBe('p2');
  expect(pos.nextColour()).toBe('b-piece');
  expect(pos.offeredPoints().length).toBe(10);
  expect(pos.emptyPoints()).toEqual(pos.offeredPoints());
  expect(pos.forbiddenPoints()).toEqual([]);
});

test("renju offered drop keeps black's fifth, clears the rest, and leaves white to play the sixth", () => {
  const dropped = play(offered(), 'B@c2');
  expect(dropped.offeredPoints()).toEqual([]);
  expect(dropped.stones.size).toBe(5);
  expect(dropped.stoneAt(square('c2'))?.role).toBe('b-piece');
  expect(dropped.turn).toBe('p2');
  expect(dropped.nextColour()).toBe('w-piece');
  expect(dropped.canSwap()).toBe(false);
  expect(drops(dropped).size).toBe(225 - 5);
  const six = play(dropped, 'W@o15');
  expect(six.openingStep).toBe('-');
  expect(six.turn).toBe('p1');
});

test('renju refuses an offered drop off the offered points, or of a white stone', () => {
  expect(refused(offered(), 'B@h1')).toBe(true);
  expect(refused(offered(), 'B@h8')).toBe(true);
  expect(refused(offered(), 'W@c2')).toBe(true);
  expect(refused(offered(), 'ss:c2')).toBe(true);
});

test('renju round trips the offered stones through the fen', () => {
  const pos = play(offering(), 'B@a1', 'B@c2');
  const written = fen(pos);
  expect(written.split(' ')[0].split('/').at(-1)).toBe('b14');
  expect(stateFields(pos).split(' ').slice(0, 3).join(' ')).toBe('b 1 x');
  const back = read(written);
  expect(keys(back.offeredPoints())).toEqual(new Set(['a1', 'c2']));
  expect(back.turn).toBe('p1');
  expect(fen(back)).toBe(written);
  expect(read(fen(offered())).turn).toBe('p2');
});

test('renju forbids a double three, split threes included', () => {
  expect(forbidden(blackToMove(['f8', 'g8', 'h6', 'h7']), 'h8')).toBe(true);
  expect(forbidden(blackToMove(['f8', 'i8', 'h6', 'h7']), 'h8')).toBe(true);
});

test('renju forbids a double four, closed and single-line fours included', () => {
  expect(forbidden(blackToMove(['e8', 'f8', 'g8', 'h4', 'h5', 'h6'], ['d8']), 'h8')).toBe(true);
  expect(forbidden(blackToMove(['c8', 'e8', 'g8', 'i8']), 'f8')).toBe(true);
});

test('renju forbids an overline', () => {
  expect(forbidden(blackToMove(['d8', 'e8', 'f8', 'g8', 'i8']), 'h8')).toBe(true);
});

test('renju allows a four-three, a single three and a single four', () => {
  expect(forbidden(blackToMove(['e8', 'f8', 'g8', 'h6', 'h7']), 'h8')).toBe(false);
  expect(forbidden(blackToMove(['f8', 'g8']), 'h8')).toBe(false);
  expect(forbidden(blackToMove(['e8', 'f8', 'g8']), 'h8')).toBe(false);
});

test('renju does not count a three white has closed at both ends', () => {
  expect(forbidden(blackToMove(['f8', 'g8', 'h6', 'h7'], ['h4', 'h9']), 'h8')).toBe(false);
});

test('renju does not count a three whose straight four would itself be forbidden', () => {
  const overlinePoints = ['e5', 'e6', 'e7', 'e9', 'e10', 'e11', 'i5', 'i6', 'i7', 'i9', 'i10', 'i11'];
  const pos = blackToMove(['f8', 'g8', 'h6', 'h7', ...overlinePoints]);
  expect(forbidden(pos, 'e8')).toBe(true);
  expect(forbidden(pos, 'i8')).toBe(true);
  expect(forbidden(pos, 'h8')).toBe(false);
});

test('renju lets exactly five win, whatever else the stone makes', () => {
  const pos = blackToMove(['d8', 'e8', 'f8', 'g8', 'h6', 'h7', 'i9', 'j10']);
  expect(forbidden(pos, 'h8')).toBe(false);
  expect(dropNext(pos, 'h8').outcome()).toEqual({ winner: 'p1' });
});

test('renju a forbidden action is legal, and loses black the game on the spot', () => {
  const after = dropNext(blackToMove(['f8', 'g8', 'h6', 'h7']), 'h8');
  expect(after.isEnd()).toBe(true);
  expect(after.outcome()).toEqual({ winner: 'p2' });
  expect(after.forbiddenDrop).toBe(square('h8'));
  expect(after.openingStep).toBe('z');
  expect(after.emptyPoints()).toEqual([]);
});

test('renju a game lost to a forbidden action reads back from its fen as over', () => {
  const after = dropNext(blackToMove(['f8', 'g8', 'h6', 'h7']), 'h8');
  const written = fen(after);
  expect(stateFields(after).split(' ').slice(0, 3).join(' ')).toBe('w 1 z');
  const back = read(written);
  expect(back.isEnd()).toBe(true);
  expect(back.outcome()).toEqual({ winner: 'p2' });
  expect(fen(back)).toBe(written);
  expect(parseFen('gomoku')(written).isErr).toBe(true);
});

test('renju a forbidden action is won by whichever seat holds white', () => {
  const pos = blackToMove(['f8', 'g8', 'h6', 'h7']);
  const swapped = read(fen(pos).replace(' b 1 - ', ' b 2 - '));
  expect(dropNext(swapped, 'h8').outcome()).toEqual({ winner: 'p1' });
});

test('renju forbids nothing to white, and gomoku nothing to anyone', () => {
  const whiteToMove = position([...black('a1', 'b3', 'd5', 'k12', 'm2'), ...white('f8', 'g8', 'h6', 'h7')]);
  expect(whiteToMove.nextColour()).toBe('w-piece');
  expect(dropNext(whiteToMove, 'h8').isEnd()).toBe(false);
  const gomoku = fiveInARowSupport(Gomoku);
  const board = gomoku.position([...black('f8', 'g8', 'h6', 'h7'), ...white(...spareWhites.slice(0, 4))]);
  expect(gomoku.dropNext(board, 'h8').isEnd()).toBe(false);
  expect(board.forbiddenPoints()).toEqual([]);
});

test("renju lists the points where black's drop would lose, only on black's turn", () => {
  expect(keys(blackToMove(['f8', 'g8', 'h6', 'h7']).forbiddenPoints()).has('h8')).toBe(true);
  expect(blackToMove(['f8', 'g8']).forbiddenPoints()).toEqual([]);
  expect(position(black('f8', 'g8', 'h6', 'h7', 'a1')).forbiddenPoints()).toEqual([]);
});

test('renju is not won by a black overline, but is by a white one or exactly five black', () => {
  expect(position(black('a8', 'b8', 'c8', 'd8', 'e8', 'f8')).isEnd()).toBe(false);
  expect(position(white('a8', 'b8', 'c8', 'd8', 'e8', 'f8')).outcome()).toEqual({ winner: 'p2' });
  expect(position(black('a8', 'b8', 'c8', 'd8', 'e8')).outcome()).toEqual({ winner: 'p1' });
});

// the same record as strategygames' RenjuTest wrapper game
const record = [
  ['B@h8'],
  ['W@h9'],
  ['B@h10'],
  ['W@h11'],
  ['offer10', 'B@a1', 'B@b1', 'B@c1', 'B@d1', 'B@e1', 'B@f1', 'B@g1', 'B@a2', 'B@b2', 'B@c2'],
  ['B@c2', 'W@o15'],
  ['B@a15'],
];

test('renju plays the strategygames record, keeping each turn with one seat', () => {
  let pos = start();
  for (const turn of record) {
    const seat = pos.turn;
    for (const [index, action] of turn.entries()) {
      expect(pos.turn).toBe(seat);
      pos = play(pos, action);
      if (index < turn.length - 1) expect(pos.turn).toBe(seat);
    }
    expect(pos.turn).not.toBe(seat);
  }
  expect(stateFields(pos)).toBe('w 1 - 4');
});

const notation = (uci: string) => Renju.computeMoveNotation({ san: '', uci, fen: '', prevFen: '' });

test('renju notation names offer10 and the offered drop by its point', () => {
  expect(notation('offer10')).toBe('offer10');
  expect(notation('B@c2')).toBe('c2');
  expect(Renju.parseLexicalUci('offer10')).toBeUndefined();
  expect(Renju.parseLexicalUci('B@c2')).toEqual({ from: 'c2', to: 'c2', dropRole: 'b-piece' });
});
