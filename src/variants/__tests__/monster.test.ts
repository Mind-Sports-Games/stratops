import { expect, test } from '@jest/globals';
import { Board, defaultSetup, type Setup } from '../..';
import { makeFen } from '../../fen';
import { Monster } from '../chess/Monster';
import { variantClass } from '../util';

test('get pieces coordinates after a possible fake half king move was described and played', () => {
  const fen = 'rnbqkbnr/pppppppp/8/8/8/8/2PPPP2/7K w kq - 0 1 ½h1h1';
  const rules = 'monster';
  const monsterClass = variantClass('monster') as typeof Monster;
  const board = monsterClass.parseFen(fen).unwrap(
    setup => setup.board,
    _ => Board.empty(rules),
  );
  const setup = monsterClass.parseFen(fen).unwrap(
    setup => setup, // keep the setup
    _ => defaultSetup() as Setup,
  );
  setup.board = board;
  const monsterPosition = monsterClass.fromSetup(setup).unwrap();
  const newFen = makeFen(rules)(monsterPosition.toSetup());
  const newBoard = monsterClass.parseFen(newFen).unwrap(
    setup => setup.board,
    _ => Board.empty(rules),
  );
  const kings = newBoard['k-piece'];
  expect(kings.toStringWH(8, 8)).toEqual(
    '. . . . . . . X\n' // 1
      + '. . . . . . . .\n'
      + '. . . . . . . .\n'
      + '. . . . . . . .\n'
      + '. . . . . . . .\n'
      + '. . . . . . . .\n'
      + '. . . . . . . .\n'
      + '. . . . X . . .\n', // 10
    // a b c d e f g h
  );
  const p1PiecesCoords = monsterClass.getPiecesCoordinates(newFen, 'p1');
  expect(p1PiecesCoords).toEqual(
    expect.arrayContaining([
      { piece: 'K', coord: 'h1' },
      { piece: 'P', coord: 'c2' },
      { piece: 'P', coord: 'd2' },
      { piece: 'P', coord: 'e2' },
      { piece: 'P', coord: 'f2' },
    ]),
  );
});

test('FEN is generated correctly for each step of 3 full rounds', () => {
  const monsterClass = variantClass('monster') as typeof Monster;
  const fen = monsterClass.getInitialFen('p1');
  expect(fen).toEqual('rnbqkbnr/pppppppp/8/8/8/8/2PPPP2/4K3 w kq - 0 1');

  const expectedFenAfterFirstAction = 'rnbqkbnr/pppppppp/8/8/8/8/2PPPP2/5K2 w kq - 1 1 ½e1f1'; // king moved toward the right
  const setupAfterFirstAction = monsterClass.parseFen(expectedFenAfterFirstAction).unwrap() as Setup;
  const positionAfterFirstAction = monsterClass.fromSetup(setupAfterFirstAction).unwrap() as Monster;
  const fenAfterFirstAction = makeFen('monster')(positionAfterFirstAction.toSetup()) as string;
  expect(fenAfterFirstAction).toEqual(expectedFenAfterFirstAction);

  const expectedFenAfterSecondAction = 'rnbqkbnr/pppppppp/8/8/2P5/8/3PPP2/5K2 b kq - 0 1'; // pawn moved forward 2 squares
  const setupAfterSecondAction = monsterClass.parseFen(expectedFenAfterSecondAction).unwrap() as Setup;
  const positionAfterSecondAction = monsterClass.fromSetup(setupAfterSecondAction).unwrap() as Monster;
  const fenAfterSecondAction = makeFen('monster')(positionAfterSecondAction.toSetup()) as string;
  expect(fenAfterSecondAction).toEqual(expectedFenAfterSecondAction);

  const expectedFenAfterThirdAction = 'rnbqkbnr/ppp1pppp/8/3p4/2P5/8/3PPP2/5K2 w kq - 0 2'; // pawn moved forward 2 squares
  const setupAfterThirdAction = monsterClass.parseFen(expectedFenAfterThirdAction).unwrap() as Setup;
  const positionAfterThirdAction = monsterClass.fromSetup(setupAfterThirdAction).unwrap() as Monster;
  const fenAfterThirdAction = makeFen('monster')(positionAfterThirdAction.toSetup()) as string;
  expect(fenAfterThirdAction).toEqual(expectedFenAfterThirdAction);

  const expectedFenAfterFourthAction = 'rnbqkbnr/ppp1pppp/8/2Pp4/8/8/3PPP2/5K2 w kq - 0 2 ½c4c5'; // pawn moved forward 1 square TODO: fix it, ofc its 1 since we just created the position
  const setupAfterFourthAction = monsterClass.parseFen(expectedFenAfterFourthAction).unwrap() as Setup;
  const positionAfterFourthAction = monsterClass.fromSetup(setupAfterFourthAction).unwrap() as Monster;
  const fenAfterFourthAction = makeFen('monster')(positionAfterFourthAction.toSetup()) as string;
  expect(fenAfterFourthAction).toEqual(expectedFenAfterFourthAction);

  const expectedFenAfterFifthAction = 'rnbqkbnr/ppp1pppp/8/2Pp4/5P2/8/3PP3/5K2 b kq - 0 2'; // pawn moved forward 2 squares
  const setupAfterFifthAction = monsterClass.parseFen(expectedFenAfterFifthAction).unwrap() as Setup;
  const positionAfterFifthAction = monsterClass.fromSetup(setupAfterFifthAction).unwrap() as Monster;
  const fenAfterFifthAction = makeFen('monster')(positionAfterFifthAction.toSetup()) as string;
  expect(fenAfterFifthAction).toEqual(expectedFenAfterFifthAction);

  const expectedFenAfterSixthAction = 'rnbqkbnr/p1p1pppp/8/1pPp4/5P2/8/3PP3/5K2 w kq b6 0 3'; // pawn moved forward 2 squares
  const setupAfterSixthAction = monsterClass.parseFen(expectedFenAfterSixthAction).unwrap() as Setup;
  const positionAfterSixthAction = monsterClass.fromSetup(setupAfterSixthAction).unwrap() as Monster;
  const fenAfterSixthAction = makeFen('monster')(positionAfterSixthAction.toSetup()) as string;
  expect(fenAfterSixthAction).toEqual(expectedFenAfterSixthAction);

  const expectedFenAfterSeventhAction = 'rnbqkbnr/p1p1pppp/1P6/3p4/5P2/8/3PP3/5K2 w kq - 0 3 ½c5b6'; // pawn captured pawn en passant
  const setupAfterSeventhAction = monsterClass.parseFen(expectedFenAfterSeventhAction).unwrap() as Setup;
  const positionAfterSeventhAction = monsterClass.fromSetup(setupAfterSeventhAction).unwrap() as Monster;
  const fenAfterSeventhAction = makeFen('monster')(positionAfterSeventhAction.toSetup()) as string;
  expect(fenAfterSeventhAction).toEqual(expectedFenAfterSeventhAction);

  const expectedFenAfterEighthAction = 'rnbqkbnr/pPp1pppp/8/3p4/5P2/8/3PP3/5K2 b kq - 0 3'; // pawn moved forward 1 square
  const setupAfterEighthAction = monsterClass.parseFen(expectedFenAfterEighthAction).unwrap() as Setup;
  const positionAfterEighthAction = monsterClass.fromSetup(setupAfterEighthAction).unwrap() as Monster;
  const fenAfterEighthAction = makeFen('monster')(positionAfterEighthAction.toSetup()) as string;
  expect(fenAfterEighthAction).toEqual(expectedFenAfterEighthAction);

  const expectedFenAfterNinthAction = 'rnbqkbnr/pPp1pppp/8/8/3p1P2/8/3PP3/5K2 w kq - 0 4'; // pawn moved forward 1 square
  const setupAfterNinthAction = monsterClass.parseFen(expectedFenAfterNinthAction).unwrap() as Setup;
  const positionAfterNinthAction = monsterClass.fromSetup(setupAfterNinthAction).unwrap() as Monster;
  const fenAfterNinthAction = makeFen('monster')(positionAfterNinthAction.toSetup()) as string;
  expect(fenAfterNinthAction).toEqual(expectedFenAfterNinthAction);

  const expectedFenAfterTenthAction = 'rnbqkbnr/pPp1pppp/8/8/3pPP2/8/3P4/5K2 w kq - 0 4 ½e2e4'; // pawn moved forward 2 squares
  const setupAfterTenthAction = monsterClass.parseFen(expectedFenAfterTenthAction).unwrap() as Setup;
  const positionAfterTenthAction = monsterClass.fromSetup(setupAfterTenthAction).unwrap() as Monster;
  const fenAfterTenthAction = makeFen('monster')(positionAfterTenthAction.toSetup()) as string;
  expect(fenAfterTenthAction).toEqual(expectedFenAfterTenthAction);

  const expectedFenAfterEleventhAction = 'Rnbqkbnr/p1p1pppp/8/8/3pPP2/8/3P4/5K2 b k e3 0 4'; // took a rook and promoted to rook
  const setupAfterEleventhAction = monsterClass.parseFen(expectedFenAfterEleventhAction).unwrap() as Setup;
  const positionAfterEleventhAction = monsterClass.fromSetup(setupAfterEleventhAction).unwrap() as Monster;
  const fenAfterEleventhAction = makeFen('monster')(positionAfterEleventhAction.toSetup()) as string;
  expect(fenAfterEleventhAction).toEqual(expectedFenAfterEleventhAction);

  const expectedFenAfterTwelfthAction = 'Rnbqkbnr/p1p1pppp/8/8/5P2/4p3/3P4/5K2 w k - 0 5'; // en passant e3
  const setupAfterTwelfthAction = monsterClass.parseFen(expectedFenAfterTwelfthAction).unwrap() as Setup;
  const positionAfterTwelfthAction = monsterClass.fromSetup(setupAfterTwelfthAction).unwrap() as Monster;
  const fenAfterTwelfthAction = makeFen('monster')(positionAfterTwelfthAction.toSetup()) as string;
  expect(fenAfterTwelfthAction).toEqual(expectedFenAfterTwelfthAction);
});
