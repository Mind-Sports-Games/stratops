/**
 * Compute attacks and rays.
 *
 * These are low-level functions that can be used to implement chess rules.
 *
 * Implementation notes: Sliding attacks are computed using
 * [hyperbola quintessence](https://www.chessprogramming.org/Hyperbola_Quintessence).
 * Magic bitboards would deliver faster lookups, but also require
 * initializing considerably larger attack tables. On the web, initialization
 * time is important, so the chosen method may strike a better balance.
 *
 * @packageDocumentation
 */

import { zip } from './fp.js';
import { SquareSet } from './squareSet.js';
import type { BySquare, Piece, PlayerIndex, Square } from './types.js';
import { squareFile, squareRank } from './util.js';

function isValid(square: Square): boolean {
  return square >= 0 && square < 64;
}

function computeRange(square: Square, deltas: number[]): SquareSet {
  let range = SquareSet.empty();
  for (const delta of deltas) {
    const sq = square + delta;
    if (isValid(sq) && Math.abs(squareFile('chess')(square) - squareFile('chess')(sq)) <= 2) {
      range = range.with(sq);
    }
  }
  return range;
}

function tabulate<T>(f: (square: Square) => T): BySquare<T> {
  const table = [];
  for (let square = 0; square < 64; square++) table[square] = f(square);
  return table;
}

const KING_ATTACKS = tabulate(sq => computeRange(sq, [-9, -8, -7, -1, 1, 7, 8, 9]));
const KNIGHT_ATTACKS = tabulate(sq => computeRange(sq, [-17, -15, -10, -6, 6, 10, 15, 17]));
const PAWN_ATTACKS = {
  p1: tabulate(sq => computeRange(sq, [7, 9])),
  p2: tabulate(sq => computeRange(sq, [-7, -9])),
};

/**
 * Gets squares attacked or defended by a king on `square`.
 */
export function kingAttacks(square: Square): SquareSet {
  return KING_ATTACKS[square];
}

/**
 * Gets squares attacked or defended by a knight on `square`.
 */
export function knightAttacks(square: Square): SquareSet {
  return KNIGHT_ATTACKS[square];
}

/**
 * Gets squares attacked or defended by a pawn of the given `playerIndex`
 * on `square`.
 */
export function pawnAttacks(playerIndex: PlayerIndex, square: Square): SquareSet {
  return PAWN_ATTACKS[playerIndex][square];
}

const FILE_RANGE = tabulate(sq => SquareSet.fromFile64(squareFile('chess')(sq)).without(sq));
const RANK_RANGE = tabulate(sq => SquareSet.fromRank64(squareRank('chess')(sq)).without(sq));

const DIAG_RANGE = tabulate(sq => {
  const diag = new SquareSet([0x0804_0201, 0x8040_2010, 0, 0]);
  const shift = 8 * (squareRank('chess')(sq) - squareFile('chess')(sq));
  return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
});

const ANTI_DIAG_RANGE = tabulate(sq => {
  const diag = new SquareSet([0x1020_4080, 0x0102_0408, 0, 0]);
  const shift = 8 * (squareRank('chess')(sq) + squareFile('chess')(sq) - 7);
  return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
});

// Note:
// The hyperbola quintessence algorithm relies on the specific bitboard geometry of an 8x8 chessboard,
// where ranks, files, and diagonals are aligned in memory and can be manipulated efficiently with bitwise operations.
// For boards of other sizes (e.g., 7x7, 9x10), the board geometry does not match the memory layout,
// so these bit tricks do not work and hyperbola quintessence cannot be applied.
// For non-8x8 boards, explicit ray traversal must be used instead.
function hyperbola(bit: SquareSet, range: SquareSet, occupied: SquareSet): SquareSet {
  let forward = occupied.intersect(range);
  let reverse = forward.bswap64(); // Assumes no more than 1 bit per rank
  forward = forward.minus64(bit);
  reverse = reverse.minus64(bit.bswap64());
  return forward.xor(reverse.bswap64()).intersect(range);
}

function fileAttacks(square: Square, occupied: SquareSet): SquareSet {
  return hyperbola(SquareSet.fromSquare(square), FILE_RANGE[square], occupied);
}

function rankAttacks(square: Square, occupied: SquareSet): SquareSet {
  const range = RANK_RANGE[square];
  let forward = occupied.intersect(range);
  let reverse = forward.rbit64();
  forward = forward.minus64(SquareSet.fromSquare(square));
  reverse = reverse.minus64(SquareSet.fromSquare(63 - square));
  return forward.xor(reverse.rbit64()).intersect(range);
}

/**
 * Gets squares attacked or defended by a bishop on `square`, given `occupied`
 * squares.
 */
export function bishopAttacks(square: Square, occupied: SquareSet): SquareSet {
  const bit = SquareSet.fromSquare(square);
  return hyperbola(bit, DIAG_RANGE[square], occupied).xor(hyperbola(bit, ANTI_DIAG_RANGE[square], occupied));
}

/**
 * Computes all squares attacked by a bishop from a given square on a generic board of size `width` × `height`.
 *
 * The function traverses all four diagonals from the starting square,
 * adding each square to the attack set until the first obstacle is encountered.
 * The ray stops at the first occupied square in each direction.
 *
 * This function does not distinguish between allied and enemy pieces:
 * all occupied squares block the ray and are included in the attack set.
 * To filter out allied pieces, use `.diffWH(allies, width, height)` on the result.
 *
 * @param square - The starting square (where the bishop is located).
 * @param occupied - A SquareSet of all occupied squares on the board.
 * @param width - The board width.
 * @param height - The board height.
 * @returns A SquareSet of all squares attacked along the diagonals, considering obstacles.
 */
export function bishopAttacksWH(square: Square, occupied: SquareSet, width = 8, height = 8): SquareSet {
  const rank = Math.floor(square / width);
  const file = square % width;
  let result = SquareSet.empty();

  for (let r = rank - 1, f = file - 1; r >= 0 && f >= 0; r--, f--) {
    const sq = r * width + f;
    result = result.with(sq);
    if (occupied.has(sq)) break;
  }
  for (let r = rank - 1, f = file + 1; r >= 0 && f < width; r--, f++) {
    const sq = r * width + f;
    result = result.with(sq);
    if (occupied.has(sq)) break;
  }
  for (let r = rank + 1, f = file - 1; r < height && f >= 0; r++, f--) {
    const sq = r * width + f;
    result = result.with(sq);
    if (occupied.has(sq)) break;
  }
  for (let r = rank + 1, f = file + 1; r < height && f < width; r++, f++) {
    const sq = r * width + f;
    result = result.with(sq);
    if (occupied.has(sq)) break;
  }

  return result;
}

/**
 * Gets squares attacked or defended by a rook on `square`, given `occupied`
 * squares.
 */
export function rookAttacks(square: Square, occupied: SquareSet): SquareSet {
  return fileAttacks(square, occupied).xor(rankAttacks(square, occupied));
}

/**
 * Computes all squares attacked by a rook from a given square on a generic board of size `width` × `height`.
 *
 * The function traverses the file and rank from the starting square,
 * adding each square to the attack set until the first obstacle is encountered in each direction.
 * The ray stops at the first occupied square in each direction.
 *
 * This function does not distinguish between allied and enemy pieces:
 * all occupied squares block the ray and are included in the attack set.
 * To filter out allied pieces, use `.diffWH(allies, width, height)` on the result.
 *
 * @param square - The starting square (where the rook is located).
 * @param occupied - A SquareSet of all occupied squares on the board.
 * @param width - The board width.
 * @param height - The board height.
 * @returns A SquareSet of all squares attacked along the file and rank, considering obstacles.
 */
export function rookAttacksWH(square: Square, occupied: SquareSet, width = 8, height = 8): SquareSet {
  return fileAttacksWH(square, occupied, width, height).padWH(width, height).xor(
    rankAttacksWH(square, occupied, width).padWH(width, height),
  );
}

/**
 * Computes all squares attacked by a piece moving along a file
 * from a given square on a generic board of size `width` × `height`.
 *
 * The function traverses the file above and below the starting square,
 * adding each square to the attack set until the first obstacle is encountered.
 * The ray stops at the first occupied square in each direction.
 *
 * This function does not distinguish between allied and enemy pieces:
 * all occupied squares block the ray and are included in the attack set.
 * To filter out allied pieces, use `.diffWH(allies, width, height)` on the result.
 *
 * @param square - The starting square (where the piece is located).
 * @param occupied - A SquareSet of all occupied squares on the board.
 * @param width - The board width.
 * @param height - The board height.
 * @returns A SquareSet of all squares attacked along the file, considering obstacles.
 */
export function fileAttacksWH(square: Square, occupied: SquareSet, width = 8, height = 8): SquareSet {
  const file = square % width;
  const rank = Math.floor(square / width);

  let result = SquareSet.empty();

  for (let r = rank - 1; r >= 0; r--) {
    const sq = r * width + file;
    result = result.with(sq);
    if (occupied.has(sq)) break;
  }
  for (let r = rank + 1; r < height; r++) {
    const sq = r * width + file;
    result = result.with(sq);
    if (occupied.has(sq)) break;
  }

  return result;
}

/**
 * Computes all squares attacked by a piece moving along a rank
 * from a given square on a generic board of size `width` × `height`.
 *
 * The function traverses the rank to the left and right of the starting square,
 * adding each square to the attack set until the first obstacle is encountered.
 * The ray stops at the first occupied square in each direction.
 *
 * This function does not distinguish between allied and enemy pieces:
 * all occupied squares block the ray and are included in the attack set.
 * To filter out allied pieces, use `.diffWH(allies, width, height)` on the result.
 *
 * @param square - The starting square (where the piece is located).
 * @param occupied - A SquareSet of all occupied squares on the board.
 * @param width - The board width.
 * @returns A SquareSet of all squares attacked along the rank, considering obstacles.
 */
export function rankAttacksWH(square: Square, occupied: SquareSet, width = 8): SquareSet {
  const rank = Math.floor(square / width);
  const file = square % width;

  let result = SquareSet.empty();

  for (let f = file - 1; f >= 0; f--) {
    const sq = rank * width + f;
    result = result.with(sq);
    if (occupied.has(sq)) break;
  }
  for (let f = file + 1; f < width; f++) {
    const sq = rank * width + f;
    result = result.with(sq);
    if (occupied.has(sq)) break;
  }

  return result;
}

/**
 * Gets squares attacked or defended by a queen on `square`, given `occupied`
 * squares.
 */
export function queenAttacks(square: Square, occupied: SquareSet): SquareSet {
  return bishopAttacks(square, occupied).xor(rookAttacks(square, occupied));
}

/**
 * Gets squares attacked or defended by a loachecker on `square`, given `occupied`
 * squares.
 */
export function linesOfActionAttacks(
  playerIndex: PlayerIndex,
  square: Square,
  occupied: SquareSet,
  p1: SquareSet,
  p2: SquareSet,
): SquareSet {
  const ours = playerIndex === 'p1' ? p1 : p2;

  const theirs = playerIndex === 'p2' ? p1 : p2;
  const deltaToSquare = (delta: Square) => square + delta;
  const pieceCountInRay = (dir: Square) => (isValid(dir) ? ray(square, dir).intersect(occupied).size() : 0);
  const nearby = [-9, -8, -7, -1, 1, 7, 8, 9];
  // Currently this calculates the rays twice for pieces on the interior of the board.
  // but we have to deal with pieces on the exterior too.
  const pieceCountPerRay = nearby.map(deltaToSquare).map(pieceCountInRay);
  const possibleTargets = zip(nearby, pieceCountPerRay)
    // NOTE: The following line can produce invalid moves
    .filter(([_, numPieces]) => numPieces > 0)
    .map(([delta, numPieces]) => square + numPieces * delta)
    .filter(isValid);
  const destsByPieceCount = possibleTargets.reduce((range, dest) => range.with(dest), SquareSet.empty());
  const nonBlockedSquares = bishopAttacks(square, theirs).xor(rookAttacks(square, theirs));
  return nonBlockedSquares.intersect(destsByPieceCount).diff64(ours);
}

/**
 * Gets squares attacked or defended by a `piece` on `square`, given
 * `occupied` squares.
 */
export function attacks(piece: Piece, square: Square, occupied: SquareSet, p1: SquareSet, p2: SquareSet): SquareSet {
  switch (piece.role) {
    case 'p-piece':
      return pawnAttacks(piece.playerIndex, square);
    case 'n-piece':
      return knightAttacks(square);
    case 'b-piece':
      return bishopAttacks(square, occupied);
    case 'r-piece':
      return rookAttacks(square, occupied);
    case 'q-piece':
      return queenAttacks(square, occupied);
    case 'k-piece':
      return kingAttacks(square);
    case 'l-piece':
      return linesOfActionAttacks(piece.playerIndex, square, occupied, p1, p2);
    default:
      return SquareSet.empty();
  }
}

/**
 * Gets all squares of the rank, file or diagonal with the two squares
 * `a` and `b`, or an empty set if they are not aligned.
 */
export function ray(a: Square, b: Square): SquareSet {
  const other = SquareSet.fromSquare(b);
  if (RANK_RANGE[a].intersects(other)) return RANK_RANGE[a].with(a);
  if (ANTI_DIAG_RANGE[a].intersects(other)) return ANTI_DIAG_RANGE[a].with(a);
  if (DIAG_RANGE[a].intersects(other)) return DIAG_RANGE[a].with(a);
  if (FILE_RANGE[a].intersects(other)) return FILE_RANGE[a].with(a);
  return SquareSet.empty();
}

/**
 * Gets all squares between `a` and `b` (bounds not included), or an empty set
 * if they are not on the same rank, file or diagonal.
 */
export function between(a: Square, b: Square): SquareSet {
  return ray(a, b)
    .intersect(SquareSet.full64().shl64(a).xor(SquareSet.full64().shl64(b)))
    .withoutFirst();
}
