import { Piece } from '../src/types';
import { Board } from '../src/board';

test('set and get', () => {
  const board = Board.empty('chess');
  expect(board.get(0)).toBeUndefined();
  const piece: Piece = { role: 'n-piece', playerIndex: 'p2', promoted: false };
  expect(board.set(0, piece)).toBeUndefined();
  expect(board.get(0)).toEqual(piece);
});
