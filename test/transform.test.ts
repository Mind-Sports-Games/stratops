import { SquareSet } from '../src/squareSet';
import { flipVertical, flipHorizontal, flipDiagonal, rotate180 } from '../src/transform';

const r = new SquareSet([0x0e0a1222, 0x1e222212, 0, 0]);

test('flip vertical', () => {
  expect(flipVertical(SquareSet.full64())).toEqual(SquareSet.full64());
  expect(flipVertical(r)).toEqual(new SquareSet([0x1222221e, 0x22120a0e, 0, 0]));
});

test('flip horizontal', () => {
  expect(flipHorizontal(SquareSet.full64())).toEqual(SquareSet.full64());
  expect(flipHorizontal(r)).toEqual(new SquareSet([0x70504844, 0x78444448, 0, 0]));
});

test('flip diagonal', () => {
  expect(flipDiagonal(SquareSet.full64())).toEqual(SquareSet.full64());
  expect(flipDiagonal(r)).toEqual(new SquareSet([0x8c88ff00, 0x00006192, 0, 0]));
});

test('rotate 180', () => {
  expect(rotate180(SquareSet.full64())).toEqual(SquareSet.full64());
  expect(rotate180(r)).toEqual(new SquareSet([0x48444478, 0x44485070, 0, 0]));
});
