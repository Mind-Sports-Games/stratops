import {
  FILE_NAMES,
  RANK_NAMES,
  CastlingSide,
  PlayerIndex,
  Square,
  Role,
  Move,
  isDrop,
  SquareName,
  Rules,
  BoardDimensions,
} from './types';

export function defined<A>(v: A | undefined): v is A {
  return v !== undefined;
}

export function opposite(playerIndex: PlayerIndex): PlayerIndex {
  return playerIndex === 'p1' ? 'p2' : 'p1';
}

export function squareRank(square: Square): number {
  return square >> 3;
}

export function squareFile(square: Square): number {
  return square & 0x7;
}

export function roleToChar(role: Role): string {
  const letterPart = role.slice(0, role.indexOf('-'));
  return letterPart.length > 1 ? letterPart.replace('p', '+') : letterPart;
}

export function charToRole(ch: 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | 'l' | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | 'L'): Role;
export function charToRole(ch: string): Role | undefined;
export function charToRole(ch: string): Role | undefined {
  switch (ch) {
    case 'P':
    case 'p':
      return 'p-piece';
    case 'N':
    case 'n':
      return 'n-piece';
    case 'B':
    case 'b':
      return 'b-piece';
    case 'R':
    case 'r':
      return 'r-piece';
    case 'Q':
    case 'q':
      return 'q-piece';
    case 'K':
    case 'k':
      return 'k-piece';
    case 'L':
    case 'l':
      return 'l-piece';
    case 'S':
    case 's':
      return 's-piece';
    case 'G':
    case 'g':
      return 'g-piece';
    default:
      return;
  }
}

export function parseSquare(str: SquareName): Square;
export function parseSquare(str: string): Square | undefined;
export function parseSquare(str: string): Square | undefined {
  if (str.length !== 2) return;
  const file = str.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = str.charCodeAt(1) - '1'.charCodeAt(0);
  if (file < 0 || file >= 8 || rank < 0 || rank >= 8) return;
  return file + 8 * rank;
}

export function makeSquare(square: Square): SquareName {
  return (FILE_NAMES[squareFile(square)] + RANK_NAMES[squareRank(square)]) as SquareName;
}

export function parseUci(str: string): Move | undefined {
  if (str[1] === '@' && str.length === 4) {
    const role = charToRole(str[0]);
    const to = parseSquare(str.slice(2));
    if (role && defined(to)) return { role, to };
  } else if (str.length === 4 || str.length === 5) {
    const from = parseSquare(str.slice(0, 2));
    const to = parseSquare(str.slice(2, 4));
    let promotion: Role | undefined;
    if (str.length === 5) {
      promotion = charToRole(str[4]);
      if (!promotion) return;
    }
    if (defined(from) && defined(to)) return { from, to, promotion };
  }
  return;
}

/**
 * Converts a move to UCI notation, like `g1f3` for a normal move,
 * `a7a8q` for promotion to a queen, and `Q@f7` for a Crazyhouse drop.
 */
export function makeUci(move: Move): string {
  if (isDrop(move)) return `${roleToChar(move.role).toUpperCase()}@${makeSquare(move.to)}`;
  return makeSquare(move.from) + makeSquare(move.to) + (move.promotion ? roleToChar(move.promotion) : '');
}

export function kingCastlesTo(playerIndex: PlayerIndex, side: CastlingSide): Square {
  return playerIndex === 'p1' ? (side === 'a' ? 2 : 6) : side === 'a' ? 58 : 62;
}

export function zip<T>(a: T[], b: T[]): Array<[T, T]> {
  return a.map((k, i) => [k, b[i]]);
}

export const boardForRules = (rules: Rules): BoardDimensions => {
  switch (rules) {
    case 'chess':
    case 'antichess':
    case 'atomic':
    case 'horde':
    case 'racingkings':
    case 'kingofthehill':
    case '3check':
    case '5check':
    case 'crazyhouse':
    case 'nocastling':
    case 'linesofaction':
    case 'scrambledeggs':
      return { ranks: 8, files: 8 };
    case 'shogi':
      return { ranks: 9, files: 9 };
    case 'minishogi':
      return { ranks: 5, files: 5 };
    case 'xiangqi':
      return { ranks: 5, files: 5 };
    case 'minixiangqi':
      return { ranks: 10, files: 9 };
    case 'flipello':
      return { ranks: 8, files: 8 };
    case 'flipello10':
      return { ranks: 10, files: 10 };
    case 'oware':
      return { ranks: 2, files: 6 };
    default:
      return { ranks: 8, files: 8 }; // Is this a reasonable default?
  }
};
