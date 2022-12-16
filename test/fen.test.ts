import { parseFen, makeFen, makeBoardFen, INITIAL_FEN, INITIAL_BOARD_FEN, EMPTY_BOARD_FEN } from '../src/fen';
import { SquareSet } from '../src/squareSet';
import { Board } from '../src/board';
import { defaultSetup } from '../src/setup';

test('make board fen', () => {
  expect(makeBoardFen('chess')(Board.default())).toEqual(INITIAL_BOARD_FEN);
  expect(makeBoardFen('chess')(Board.empty('chess'))).toEqual(EMPTY_BOARD_FEN);
  expect(makeBoardFen('chess')(Board.racingKings())).toEqual('8/8/8/8/8/8/krbnNBRK/qrbnNBRQ');
  expect(makeBoardFen('chess')(Board.horde())).toEqual(
    'rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP'
  );
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

test.each(['lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1'])(
  'parse and make shogi fen',
  fen => {
    const setup = parseFen('shogi')(fen).unwrap();
    expect(makeFen('shogi')(setup, { promoted: true })).toEqual(fen);
  }
);
test.each(['1LLLLLL1/l6l/l6l/l6l/l6l/l6l/l6l/1LLLLLL1 w - - 0 1'])('parse and make lines of action fen', fen => {
  const setup = parseFen('linesofaction')(fen).unwrap();
  expect(makeFen('linesofaction')(setup, { promoted: true })).toEqual(fen);
});
test.each(['DDDDDD/DDDDDD 0 0 S'])('parse and make oware fen', fen => {
  const setup = parseFen('oware')(fen).unwrap();
  expect(makeFen('oware')(setup, { promoted: true })).toEqual(fen);
});
