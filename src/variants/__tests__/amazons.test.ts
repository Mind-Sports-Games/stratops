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
