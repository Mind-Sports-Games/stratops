import { expect, test } from '@jest/globals';
import { Board, defaultSetup, Setup } from '../..';
import { makeFen } from '../../fen';
import { Amazons } from '../amazons/Amazons';
import { variantClass } from '../util';

test('get pieces coordinates', () => {
  const fen = '3q2q3/10/10/q8q/10/10/Q8Q/10/10/3Q2Q3 w - - 56 1';
  const rules = 'amazons';
  const amazonsClass = variantClass('amazons') as typeof Amazons;
  const board = amazonsClass.parseFen(fen).unwrap(
    setup => setup.board,
    _ => Board.empty(rules),
  );
  const queens = board['q-piece'];
  expect(queens.toStringWH(10, 10)).toEqual(
    '. . . X . . X . . .\n'
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . .\n'
      + 'X . . . . . . . . X\n'
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . .\n'
      + 'X . . . . . . . . X\n'
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . .\n'
      + '. . . X . . X . . .\n',
  );
});

test('get pieces coordinates after half a move was described but not played', () => {
  const fen = '3q2q3/10/10/q8q/10/10/Q8Q/10/10/3Q2Q3 w - - 56 1 ½a4a1';
  const rules = 'amazons';
  const amazonsClass = variantClass('amazons') as typeof Amazons;
  const board = amazonsClass.parseFen(fen).unwrap(
    setup => setup.board,
    _ => Board.empty(rules),
  );
  const queens = board['q-piece'];
  expect(queens.toStringWH(10, 10)).toEqual(
    '. . . X . . X . . .\n'
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . .\n'
      + 'X . . . . . . . . X\n'
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . .\n'
      + 'X . . . . . . . . X\n'
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . .\n'
      + '. . . X . . X . . .\n',
  );
});

test('get pieces coordinates after half a move was described and played', () => {
  const fen = '3q2q3/10/10/q8q/10/10/Q8Q/10/10/3Q2Q3 w - - 56 1 ½a4a1';
  const rules = 'amazons';
  const amazonsClass = variantClass('amazons') as typeof Amazons;
  const board = amazonsClass.parseFen(fen).unwrap(
    setup => setup.board,
    _ => Board.empty(rules),
  );
  const setup = amazonsClass.parseFen(fen).unwrap(
    setup => setup, // keep the setup
    _ => defaultSetup() as Setup,
  );
  setup.board = board;
  const amazonsPosition = amazonsClass.fromSetup(setup).unwrap();
  const newFen = makeFen(rules)(amazonsPosition.toSetup());
  const newBoard = amazonsClass.parseFen(newFen).unwrap(
    setup => setup.board,
    _ => Board.empty(rules),
  );
  const queens = newBoard['q-piece'];
  expect(queens.toStringWH(10, 10)).toEqual(
    'X . . X . . X . . .\n' // 1
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . X\n'
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . .\n'
      + 'X . . . . . . . . X\n'
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . .\n'
      + '. . . X . . X . . .\n', // 10
    // a b c d e f g h i j
  );
  const p1PiecesCoords = amazonsClass.getPiecesCoordinates(newFen, 'p1');
  expect(p1PiecesCoords).toEqual([
    { piece: 'Q', coord: 'a1' },
    { piece: 'Q', coord: 'd1' },
    { piece: 'Q', coord: 'g1' },
    { piece: 'Q', coord: 'j4' },
  ]);
  const p2PiecesCoords = amazonsClass.getPiecesCoordinates(newFen, 'p2');
  expect(p2PiecesCoords).toEqual([
    { piece: 'q', coord: 'a7' },
    { piece: 'q', coord: 'j7' },
    { piece: 'q', coord: 'd10' },
    { piece: 'q', coord: 'g10' },
  ]);
  // Note: would be interesting to check if White can now play an arrow or not.
});

test('get pieces coordinates after half a fake impossible move was described and played', () => {
  const fen = '3q2q3/10/10/q8q/10/10/Q8Q/10/10/3Q2Q3 w - - 56 1 ½a1a1';
  const rules = 'amazons';
  const amazonsClass = variantClass('amazons') as typeof Amazons;
  const board = amazonsClass.parseFen(fen).unwrap(
    setup => setup.board,
    _ => Board.empty(rules),
  );
  const setup = amazonsClass.parseFen(fen).unwrap(
    setup => setup, // keep the setup
    _ => defaultSetup() as Setup,
  );
  setup.board = board;
  const amazonsPosition = amazonsClass.fromSetup(setup).unwrap();
  const newFen = makeFen(rules)(amazonsPosition.toSetup());
  const newBoard = amazonsClass.parseFen(newFen).unwrap(
    setup => setup.board,
    _ => Board.empty(rules),
  );
  const queens = newBoard['q-piece'];
  expect(queens.toStringWH(10, 10)).toEqual(
    '. . . X . . X . . .\n' // 1
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . .\n'
      + 'X . . . . . . . . X\n'
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . .\n'
      + 'X . . . . . . . . X\n'
      + '. . . . . . . . . .\n'
      + '. . . . . . . . . .\n'
      + '. . . X . . X . . .\n', // 10
    // a b c d e f g h i j
  );
  const p1PiecesCoords = amazonsClass.getPiecesCoordinates(newFen, 'p1');
  expect(p1PiecesCoords).toEqual([
    { piece: 'Q', coord: 'a4' },
    { piece: 'Q', coord: 'd1' },
    { piece: 'Q', coord: 'g1' },
    { piece: 'Q', coord: 'j4' },
  ]);
  const p2PiecesCoords = amazonsClass.getPiecesCoordinates(newFen, 'p2');
  expect(p2PiecesCoords).toEqual([
    { piece: 'q', coord: 'a7' },
    { piece: 'q', coord: 'j7' },
    { piece: 'q', coord: 'd10' },
    { piece: 'q', coord: 'g10' },
  ]);
  // Note: would be interesting to check if White can now shoot an arrow or not.
});

test('FEN is generated correctly for each of the first 4 actions of the game', () => {
  const amazonsClass = variantClass('amazons') as typeof Amazons;
  const fen = amazonsClass.getInitialFen('p1');
  expect(fen).toEqual(
    '3q2q3/10/10/q8q/10/10/Q8Q/10/10/3Q2Q3/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp w - - 0 1',
  );

  const expectedFenAfterFirstAction =
    '3q2q3/10/10/q8q/10/10/Q2Q5Q/10/10/6Q3[PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp] w - - 0 1 ½d1d4';
  const setupAfterFirstAction = amazonsClass.parseFen(
    '3q2q3/10/10/q8q/10/10/Q2Q5Q/10/10/6Q3/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp w - - 0 1 ½d1d4',
  ).unwrap() as Setup;
  const positionAfterFirstAction = amazonsClass.fromSetup(setupAfterFirstAction).unwrap() as Amazons;
  const fenAfterFirstAction = makeFen('amazons')(positionAfterFirstAction.toSetup()) as string;
  expect(fenAfterFirstAction).toEqual(expectedFenAfterFirstAction);

  const expectedFenAfterSecondAction =
    '3q2q3/10/10/q8q/10/10/Q1pQ5Q/10/10/6Q3[PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp] b - - 1 1';
  const setupAfterSecondAction = amazonsClass.parseFen(
    '3q2q3/10/10/q8q/10/10/Q1pQ5Q/10/10/6Q3/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp b - - 1 1',
  ).unwrap() as Setup;
  const positionAfterSecondAction = amazonsClass.fromSetup(setupAfterSecondAction).unwrap() as Amazons;
  const fenAfterSecondAction = makeFen('amazons')(positionAfterSecondAction.toSetup()) as string;
  expect(fenAfterSecondAction).toEqual(expectedFenAfterSecondAction);

  const expectedFenAfterThirdAction =
    'q2q2q3/10/10/9q/10/10/Q1pQ5Q/10/10/6Q3[PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp] b - - 1 1 ½a7a10';
  const setupAfterThirdAction = amazonsClass.parseFen(
    'q2q2q3/10/10/9q/10/10/Q1pQ5Q/10/10/6Q3/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp b - - 1 1 ½a7a10',
  ).unwrap() as Setup;
  const positionAfterThirdAction = amazonsClass.fromSetup(setupAfterThirdAction).unwrap() as Amazons;
  const fenAfterThirdAction = makeFen('amazons')(positionAfterThirdAction.toSetup()) as string;
  expect(fenAfterThirdAction).toEqual(expectedFenAfterThirdAction);

  const expectedFenAfterFourthAction =
    'q2q2q3/10/10/9q/10/p9/Q1pQ5Q/10/10/6Q3[PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp] w - - 2 2';
  const setupAfterFourthAction = amazonsClass.parseFen(
    'q2q2q3/10/10/9q/10/p9/Q1pQ5Q/10/10/6Q3/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp w - - 2 2',
  ).unwrap() as Setup;
  const positionAfterFourthAction = amazonsClass.fromSetup(setupAfterFourthAction).unwrap() as Amazons;
  const fenAfterFourthAction = makeFen('amazons')(positionAfterFourthAction.toSetup()) as string;
  expect(fenAfterFourthAction).toEqual(expectedFenAfterFourthAction);
});
