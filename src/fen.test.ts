import { expect, test } from '@jest/globals';
import { Board } from './board.js';
import { amazonsChessgroundFen } from './compat.js';
import { EMPTY_BOARD_FEN, INITIAL_BOARD_FEN, INITIAL_FEN, makeBoardFen, makeFen, parseFen } from './fen.js';
import { defaultSetup } from './setup.js';
import { SquareSet } from './squareSet.js';
import { Piece } from './types.js';
import { parseSquare } from './util.js';
import { setupPosition } from './variant.js';

test('make board fen', () => {
  expect(makeBoardFen('chess')(Board.default())).toEqual(INITIAL_BOARD_FEN);
  expect(makeBoardFen('chess')(Board.empty('chess'))).toEqual(EMPTY_BOARD_FEN);
  expect(makeBoardFen('chess')(Board.racingKings())).toEqual('8/8/8/8/8/8/krbnNBRK/qrbnNBRQ');
  expect(makeBoardFen('chess')(Board.horde())).toEqual(
    'rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP',
  );
  expect(makeBoardFen('chess')(Board.monster())).toEqual('rnbqkbnr/pppppppp/8/8/8/8/2PPPP2/4K3');
});

test('make initial fen', () => {
  expect(makeFen('chess')(defaultSetup())).toEqual(INITIAL_FEN);
});

test('parse initial fen', () => {
  const setup = parseFen('chess')(INITIAL_FEN).unwrap();
  expect(setup.board).toEqual(Board.default());
  expect(setup.pockets).toBeUndefined();
  expect(setup.turn).toEqual('p1');
  expect(setup.unmovedRooks).toEqual(SquareSet.corners64());
  expect(setup.epSquare).toBeUndefined();
  expect(setup.remainingChecks).toBeUndefined();
  expect(setup.halfmoves).toEqual(0);
  expect(setup.fullmoves).toEqual(1);
});

test('partial fen', () => {
  const setup = parseFen('chess')(INITIAL_BOARD_FEN).unwrap();
  expect(setup.board).toEqual(Board.default());
  expect(setup.pockets).toBeUndefined();
  expect(setup.turn).toEqual('p1');
  expect(setup.unmovedRooks).toEqual(SquareSet.empty());
  expect(setup.epSquare).toBeUndefined();
  expect(setup.remainingChecks).toBeUndefined();
  expect(setup.halfmoves).toEqual(0);
  expect(setup.fullmoves).toEqual(1);
});

test.each([
  '8/8/8/8/8/8/8/8 w - - 1+2 12 42',
  '8/8/8/8/8/8/8/8[Q] b - - 0 1',
  'r3k2r/8/8/8/8/8/8/R3K2R[] w Qkq - 0 1',
  'r3kb1r/p1pN1ppp/2p1p3/8/2Pn4/3Q4/PP3PPP/R1B2q~K1[] w kq - 0 1',
  'rnb1kbnr/ppp1pppp/2Pp2PP/1P3PPP/PPP1PPPP/PPP1PPPP/PPP1PPP1/PPPqPP2 w kq - 0 1',
  '5b1r/1p5p/4ppp1/4Bn2/1PPP1PP1/4P2P/3k4/4K2R w K - 1 1',
])('parse and make fen', fen => {
  const setup = parseFen('chess')(fen).unwrap();
  expect(makeFen('chess')(setup, { promoted: true })).toEqual(fen);
});

test.each(['rnbqkbnr/pppppppp/8/8/8/8/2PPPP2/4K3 w kq - 0 1'])('parse and make monster chess fen', fen => {
  const setup = parseFen('monster')(fen).unwrap();
  expect(makeFen('monster')(setup, { promoted: true })).toEqual(fen);
});

test.each([
  'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1',
  'lnsgkgsnl/1r5+B1/pppppp1pp/6p2/9/2P6/PP1PPPPPP/7R1/LNSGKGSNL[B] b - - 0 2',
])('parse and make shogi fen', fen => {
  const setup = parseFen('shogi')(fen).unwrap();
  expect(makeFen('shogi')(setup, { promoted: true })).toEqual(fen);
});

test.each(['1LLLLLL1/l6l/l6l/l6l/l6l/l6l/l6l/1LLLLLL1 w - - 0 1'])('parse and make lines of action fen', fen => {
  const setup = parseFen('linesofaction')(fen).unwrap();
  expect(makeFen('linesofaction')(setup, { promoted: true })).toEqual(fen);
});
test.each(['4S,4S,4S,4S,4S,4S/4S,4S,4S,4S,4S,4S 0 0 S 1'])('parse and make oware fen', fen => {
  const setup = parseFen('oware')(fen).unwrap();
  expect(makeFen('oware')(setup, { promoted: true })).toEqual(fen);
  expect(setup.fullmoves).toEqual(1);
});
test.each(['11S,5/2,23S,3 11 3 S 50'])('parse and make oware fen', fen => {
  const setup = parseFen('oware')(fen).unwrap();
  expect(makeFen('oware')(setup, { promoted: true })).toEqual(fen);
});
test.each(['5,11S/2,S,2,23S 11 3 S 50'])('parse and make oware fen', fen => {
  const setup = parseFen('oware')(fen).unwrap();
  expect(makeFen('oware')(setup, { promoted: true })).toEqual(fen);
});
test.each(['9S,9S,9S,9S,9S,9S,9S,9S,9S/9S,9S,9S,9S,9S,9S,9S,9S,9S 0 0 S 1'])('parse and make togyzkumalak fen', fen => {
  const setup = parseFen('togyzkumalak')(fen).unwrap();
  expect(makeFen('togyzkumalak')(setup, { promoted: true })).toEqual(fen);
});
test.each(['2,T,24S,2S,9S,3S,9S,9S/2S,11S,2S,T,2,9S,9S,4S 30 39 S 16'])('parse and make togyzkumalak fen', fen => {
  const setup = parseFen('togyzkumalak')(fen).unwrap();
  expect(makeFen('togyzkumalak')(setup, { promoted: true })).toEqual(fen);
});
test.each([
  '3q2q3/10/10/q8q/10/10/Q8Q/10/10/3Q2Q3[PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp] w - - 0 1',
  '3q2q3/10/10/q8q/10/10/Q8Q/10/10/3Q2Q3[PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp] w - - 0 1 ½g1j1',
])('parse and make amazons fen', fen => {
  const setup = parseFen('amazons')(fen).unwrap();
  expect(makeFen('amazons')(setup, { promoted: true })).toEqual(fen);
});
test.each([
  '3q2q3/10/10/q8q/10/10/Q8Q/10/10/3Q2Q3[PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp] w - - 0 1 ½g1j1',
])('amazons fen for chessground', fen => {
  const setup = parseFen('amazons')(fen).unwrap();
  const game = setupPosition('amazons', setup).unwrap();
  const j1 = parseSquare('amazons')('j1');
  expect(j1 !== undefined).toBeTruthy();
  const pieceOrUndef = game.board.get(j1 as number);
  expect(pieceOrUndef !== undefined).toBeTruthy();
  const piece = pieceOrUndef as Piece;
  expect(piece.role).toEqual('q-piece');
  const chessGroundFen = `3q2q3/10/10/q8q/10/10/Q8Q/10/10/3Q5Q b - - 1 1`;
  expect(amazonsChessgroundFen(fen)).toEqual(chessGroundFen);
});
test.each([
  '8/8/8/3pP3/3Pp3/8/8/8[PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp] w - - 0 1',
])('parse and make flipello fen', fen => {
  const setup = parseFen('flipello')(fen).unwrap();
  expect(makeFen('flipello')(setup, { promoted: true })).toEqual(fen);
});

test.each(['5S,3,3s,1,5s,4,2S/5s,3,3S,1,5S,4,2s[] - - w 0 0 1'])('parse and make backgammon fen 1', fen => {
  const setup = parseFen('backgammon')(fen).unwrap();
  expect(makeFen('backgammon')(setup, { promoted: true })).toEqual(fen);
  expect(setup.fullmoves).toEqual(1);
});
test.each(['6,2s,2s,2s,2s,2s,2s/6,5S,5[5S] 5/1 - w 5 3 25'])('parse and make backgammon fen 2', fen => {
  const setup = parseFen('backgammon')(fen).unwrap();
  expect(makeFen('backgammon')(setup, { promoted: true })).toEqual(fen);
});
test.each(['6,2s,2s,2s,2s,2s,2s/6,5S,5[5S,2s] 2/2/2 2 w 5 1 25'])('parse and make backgammon fen 3', fen => {
  const setup = parseFen('backgammon')(fen).unwrap();
  expect(makeFen('backgammon')(setup, { promoted: true })).toEqual(fen);
});

test.each([
  // 'SSS16/19/5S1S11/4S1S4S7/11s7/6s3ss7/S8S2s1S4/4s5Ss2s2S1/4sS7S5/8s9S/3sS3S3S2s3/7s1S1Ss5S/8Ss9/3sS7s2ss2/5s2s2s7/7sS10/4S6S1s5/8S10/16sss[SSSSSSSSSSssssssssss] b - 280 345 0 0 75 0 29',
  '19/19/19/19/19/19/19/19/19/19/19/19/19/19/19/19/19/19/19[SSSSSSSSSSssssssssss] b - 0 75 0 0 75 0 1',
])('parse and make go fens', fen => {
  const setup = parseFen('go19x19')(fen).unwrap();
  expect(makeFen('go19x19')(setup, { promoted: true })).toEqual(fen);
});

// TODO add Abalone fen tests (and parsing if its different)
