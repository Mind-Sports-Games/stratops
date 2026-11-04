import type { Role, Square } from '../../types';

// The renju international federation's definitions, applied to black only, as strategygames' Forbidden has them.

export interface Grid {
  stones: Map<Square, Role>;
  width: number;
  height: number;
}

export const LINE_DIRECTIONS: [number, number][] = [[1, 0], [0, 1], [1, 1], [1, -1]];

const REACH = 4;

export const step = (
  grid: Pick<Grid, 'width' | 'height'>,
  from: Square,
  dx: number,
  dy: number,
): Square | undefined => {
  const file = (from % grid.width) + dx;
  const rank = Math.floor(from / grid.width) + dy;
  return file >= 0 && file < grid.width && rank >= 0 && rank < grid.height ? file + rank * grid.width : undefined;
};

const isOpen = (grid: Grid, square: Square): boolean => !grid.stones.has(square);

const line = (grid: Grid, at: Square, dx: number, dy: number): Square[] => {
  const squares: Square[] = [];
  for (let n = -REACH; n <= REACH; n++) {
    const square = step(grid, at, dx * n, dy * n);
    if (square !== undefined) squares.push(square);
  }
  return squares;
};

// the unbroken line of `role` through `at`, which counts as one of them whatever is on it
export const run = (grid: Grid, at: Square, dx: number, dy: number, role: Role = 'b-piece'): Square[] => {
  const side = (sx: number, sy: number): Square[] => {
    const squares: Square[] = [];
    for (let square = step(grid, at, sx, sy); square !== undefined && grid.stones.get(square) === role;) {
      squares.push(square);
      square = step(grid, square, sx, sy);
    }
    return squares;
  };
  return [...side(-dx, -dy).reverse(), at, ...side(dx, dy)];
};

// a trial stone goes on the working copy of the stones only while `look` runs
const withBlack = <T>(grid: Grid, at: Square, look: () => T): T => {
  grid.stones.set(at, 'b-piece');
  const seen = look();
  grid.stones.delete(at);
  return seen;
};

const makesFive = (grid: Grid, at: Square): boolean =>
  LINE_DIRECTIONS.some(([dx, dy]) => run(grid, at, dx, dy).length === 5);

const makesOverline = (grid: Grid, at: Square): boolean =>
  LINE_DIRECTIONS.some(([dx, dy]) => run(grid, at, dx, dy).length > 5);

interface Four {
  stones: Square[];
  ends: Square[];
}

// a four is the set of black stones one drop on the line turns into exactly five, gathered here with
// the drops that do it: the two ends of an open four are one four, and B_BBB_B is two
const foursAlong = (grid: Grid, at: Square, dx: number, dy: number): Four[] => {
  const fours = new Map<string, Four>();
  for (const gap of line(grid, at, dx, dy).filter(square => isOpen(grid, square))) {
    const five = withBlack(grid, gap, () => run(grid, gap, dx, dy));
    if (five.length !== 5 || !five.includes(at)) continue;
    const stones = five.filter(square => square !== gap).sort((a, b) => a - b);
    const key = stones.join(',');
    fours.set(key, { stones, ends: [...(fours.get(key)?.ends ?? []), gap] });
  }
  return [...fours.values()];
};

// a three is a line one more stone turns into a straight four, by a drop that is itself allowed
const threeAlong = (grid: Grid, at: Square, dx: number, dy: number): boolean =>
  line(grid, at, dx, dy)
    .filter(square => isOpen(grid, square))
    .some(gap =>
      withBlack(
        grid,
        gap,
        () => foursAlong(grid, at, dx, dy).some(four => four.ends.length === 2 && four.stones.includes(gap)),
      )
      && !forbiddenOn(grid, gap)
    );

const forbiddenOn = (grid: Grid, at: Square): boolean =>
  withBlack(grid, at, () => {
    if (makesFive(grid, at)) return false;
    if (makesOverline(grid, at)) return true;
    const fours = LINE_DIRECTIONS.reduce((count, [dx, dy]) => count + foursAlong(grid, at, dx, dy).length, 0);
    return fours >= 2 || LINE_DIRECTIONS.filter(([dx, dy]) => threeAlong(grid, at, dx, dy)).length >= 2;
  });

// `grid` is the position before black drops on `at`; a drop that makes exactly five is never forbidden
export const isForbidden = (grid: Grid, at: Square): boolean =>
  forbiddenOn({ ...grid, stones: new Map(grid.stones) }, at);
