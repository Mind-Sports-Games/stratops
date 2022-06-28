export const FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export type FileName = typeof FILE_NAMES[number];

export const RANK_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export type RankName = typeof RANK_NAMES[number];

export type Square = number;

export type SquareName = `${FileName}${RankName}`;

/**
 * Indexable by square indices.
 */
export type BySquare<T> = T[];

export const PLAYERINDEXES = ['p1', 'p2'] as const;

export type PlayerIndex = typeof PLAYERINDEXES[number];

/**
 * Indexable by `p1` and `p2`.
 */
export type ByPlayerIndex<T> = {
  [playerIndex in PlayerIndex]: T;
};

//curretnly supported pieces, should change to use Role to accept all new peices.
export const ROLES = ['p-piece', 'n-piece', 'b-piece', 'r-piece', 'q-piece', 'k-piece', 'l-piece'] as const;
//export type Role = typeof ROLES[number];

export const letters = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
] as const;
export type Letter = typeof letters[number];
export type Role = `${Letter}-piece` | `p${Letter}-piece`;

/**
 * Indexable by `pawn`, `knight`, `bishop`, `rook`, `queen`, and `king`.
 */
export type ByRole<T> = {
  [role in Role]: T;
};

export const CASTLING_SIDES = ['a', 'h'] as const;

export type CastlingSide = typeof CASTLING_SIDES[number];

/**
 * Indexable by `a` and `h`.
 */
export type ByCastlingSide<T> = {
  [side in CastlingSide]: T;
};

export interface Piece {
  role: Role;
  playerIndex: PlayerIndex;
  promoted?: boolean;
}

export interface NormalMove {
  from: Square;
  to: Square;
  promotion?: Role;
}

export interface DropMove {
  role: Role;
  to: Square;
}

export type Move = NormalMove | DropMove;

export function isDrop(v: Move): v is DropMove {
  return 'role' in v;
}

export function isNormal(v: Move): v is NormalMove {
  return 'from' in v;
}

export const RULES = [
  'chess',
  'antichess',
  'kingofthehill',
  '3check',
  '5check',
  'atomic',
  'horde',
  'racingkings',
  'crazyhouse',
  'nocastling',
  'scrambledeggs',
  'linesofaction',
  'shogi',
  'minishogi',
  'xiangqi',
  'minixiangqi',
  'flipello',
  'flipello10',
  'oware',
] as const;

export type Rules = typeof RULES[number];

export interface Outcome {
  winner: PlayerIndex | undefined;
}
