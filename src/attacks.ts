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

import { squareFile, squareRank, zip } from './util';
import { Square, Piece, PlayerIndex, BySquare } from './types';
import { SquareSet } from './squareSet';

function isValid(square: Square): boolean {
  return square >= 0 && square < 64;
}

function computeRange(square: Square, deltas: number[]): SquareSet {
  let range = SquareSet.empty();
  for (const delta of deltas) {
    const sq = square + delta;
    if (isValid(sq) && Math.abs(squareFile(square) - squareFile(sq)) <= 2) {
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

const FILE_RANGE = tabulate(sq => SquareSet.fromFile(squareFile(sq)).without(sq));
const RANK_RANGE = tabulate(sq => SquareSet.fromRank(squareRank(sq)).without(sq));

const DIAG_RANGE = tabulate(sq => {
  const diag = new SquareSet(0x0804_0201, 0x8040_2010);
  const shift = 8 * (squareRank(sq) - squareFile(sq));
  return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
});

const ANTI_DIAG_RANGE = tabulate(sq => {
  const diag = new SquareSet(0x1020_4080, 0x0102_0408);
  const shift = 8 * (squareRank(sq) + squareFile(sq) - 7);
  return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
});

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
 * Gets squares attacked or defended by a rook on `square`, given `occupied`
 * squares.
 */
export function rookAttacks(square: Square, occupied: SquareSet): SquareSet {
  return fileAttacks(square, occupied).xor(rankAttacks(square, occupied));
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
  p2: SquareSet
): SquareSet {
  // TODO: write some tests.
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
  return nonBlockedSquares.intersect(destsByPieceCount).diff(ours);
}

/**
 * Gets squares attacked or defended by a `piece` on `square`, given
 * `occupied` squares.
 */
export function attacks(
  piece: Piece,
  square: Square,
  occupied: SquareSet,
  p1: SquareSet,
  p2: SquareSet
): SquareSet {
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
    .intersect(SquareSet.full().shl64(a).xor(SquareSet.full().shl64(b)))
    .withoutFirst();
}
