import { type BoardDimensions, type Rules } from '../../types';

export type Pos = [number, number];

export const getBoardSize = (variant: Rules): BoardDimensions => {
  switch (variant) {
    default:
    case 'abalone':
      return { files: 9, ranks: 9 };
    case 'grandabalone':
      return { files: 11, ranks: 11 };
  }
};

// export const isUsable = (_variant: Rules, piece: Piece, player: PlayerIndex): boolean => {
// 	return piece.playerIndex === player;
// }
// export const isPushable = (variant: Rules, piece: Piece, player: PlayerIndex): boolean => {
// 	return isEjectable(variant, piece, player);
// }
// export const isEjectable = (_variant: Rules, piece: Piece, player: PlayerIndex): boolean => {
// 	return piece.playerIndex !== player;
// }

export const getMaxUsable = (variant: Rules): number | undefined => {
  switch (variant) {
    default:
      return undefined;
    case 'abalone':
      return 3;
    case 'grandabalone':
      return 4;
  }
};
export const getWinningScore = (variant: Rules): number => {
  switch (variant) {
    default:
    case 'abalone':
      return 6;
    case 'grandabalone':
      return 10;
  }
};
export const hasPrevPlayer = (variant: Rules): boolean => {
  switch (variant) {
    default:
    case 'abalone':
      return false;
    case 'grandabalone':
      return true;
  }
};

export const getCellList = (variant: Rules): Pos[] => {
  const size = getBoardSize(variant);
  const res: Pos[] = [];

  for (let y = size.ranks - 1; y >= 0; y--) {
    for (let x = 0; x < size.files; x++) {
      const pos: Pos = [x, y];
      if (isCellCore(size, pos)) res.push(pos);
    }
  }

  return res;
};

// export const pos2key = (pos: Pos): Key => {
// 	return (files[pos[1]] + ranks19[pos[0]]) as Key;
// };
//
// export const key2pos = (k: Key): Pos => {
// 	return [parseInt(k.slice(1)) - 1, k.charCodeAt(0) - 97] as Pos;
// };

export const sr3 = Math.sqrt(3);

export const getCentre = (variant: Rules): Pos => {
  return getCentreCore(getBoardSize(variant));
};
export const getCentreCore = (d: BoardDimensions): Pos => {
  return [Math.floor(d.files / 2), Math.floor(d.ranks / 2)];
};

export const isCell = (variant: Rules, pos: Pos): boolean => {
  return isCellCore(getBoardSize(variant), pos);
};
const isCellCore = (d: BoardDimensions, pos: Pos): boolean => {
  const centre = getCentreCore(d);
  return dist(centre, pos) <= centre[0];
};

//
// Geometry
export const add = (a: Pos, b: Pos): Pos => {
  return [a[0] + b[0], a[1] + b[1]];
};
export const sub = (a: Pos, b: Pos): Pos => {
  return add(a, mult(-1, b));
};
export const mult = (n: number, a: Pos): Pos => {
  return mult2(n, n, a);
};
export const mult2 = (n: number, p: number, a: Pos): Pos => {
  return [n * a[0], p * a[1]];
};
export const div = (n: number, a: Pos): Pos => {
  return mult(1 / n, a);
};
export const div2 = (n: number, p: number, a: Pos): Pos => {
  return mult2(1 / n, 1 / p, a);
};

export const vectTo3 = (a: Pos): Pos => {
  return [a[0] - a[1] / 2., a[1] * sr3 / 2];
};
export const cross = (a: Pos, b: Pos): number => {
  return a[0] * b[1] - a[1] * b[0];
};

export const getRotated = (a: Pos, deg: number): Pos => {
  const rot = deg * 180 / Math.PI;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return [cos * a[0] - sin * a[1], sin * a[0] + cos * a[1]];
};
export const getRotatedKeepNorm = (a: Pos, deg: number): Pos => {
  const p = getRotated(a, deg);

  let n = norm(p);
  if (n > 0) {
    n = norm(a) / n;
  }

  return mult(n, p);
};
export const getPrev = (vect: Pos): Pos => {
  return getPrevCore(getNeighVectors(), vect);
};
export const getPrevCore = (neighVectors: Pos[], vect: Pos): Pos => {
  return getRotatedKeepNorm(vect, -360 / neighVectors.length);
};
export const getNext = (vect: Pos): Pos => {
  return getNextCore(getNeighVectors(), vect);
};
export const getNextCore = (neighVectors: Pos[], vect: Pos): Pos => {
  return getRotatedKeepNorm(vect, 360 / neighVectors.length);
};

export const getAngle = (a: Pos): number => {
  return Math.atan2(a[1], a[0]) * 180 / Math.PI;
};
export const getAngle360 = (a: Pos): number => {
  return rest(getAngle(a), 360);
};
export const rest = (todiv: number, divby: number): number => {
  let res = todiv % divby;

  if (res < 0) res += divby > 0 ? divby : -divby;
  // if (res === -0) res = 0;
  if (res < 0) res = 0;

  return res;
};
export const divint = (todiv: number, divby: number): number => {
  let res = todiv / divby;
  if (todiv < 0 && todiv % divby !== 0) res += divby > 0 ? -1 : 1;

  return res;
};

export const dist = (pos0: Pos, pos1: Pos): number => {
  return normCore(pos0[0] - pos1[0], pos0[1] - pos1[1]);
};
export const norm = (pos: Pos): number => {
  return normCore(pos[0], pos[1]);
};
export const normCore = (x: number, y: number): number => {
  return x * y < 0
    ? Math.abs(x) + Math.abs(y)
    : Math.max(Math.abs(x), Math.abs(y));
};

export const dist2 = (pos0: Pos, pos1: Pos): number => {
  return norm2Core(pos0[0] - pos1[0], pos0[1] - pos1[1]);
};
export const norm2 = (pos: Pos): number => {
  return norm2Core(pos[0], pos[1]);
};
export const norm2Core = (x: number, y: number): number => {
  return Math.sqrt(x * x + y * y);
};

const normRadius = 1;
export const getNeighVectors = (): Pos[] => {
  const res = [];

  for (let i = -normRadius; i <= normRadius; i++) {
    for (let j = -normRadius; j <= normRadius; j++) {
      if (normCore(i, j) === 1) {
        res.push([i, j] as Pos);
      }
    }
  }

  return res;
};
export const includes = (positions: Pos[], pos: Pos): boolean => {
  for (const p of positions) {
    if (p[0] === pos[0] && p[1] === pos[1]) return true;
  }
  return false;
};