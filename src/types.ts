export const FILE_NAMES = [
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
] as const;

export type FileName = typeof FILE_NAMES[number];

export const RANK_NAMES = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
] as const;

export type RankName = typeof RANK_NAMES[number];

export type Square = number;

export type SquareName = `${FileName}${RankName}`;

/**
 * Board dimensions
 */
export type BoardDimensions = {
  ranks: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19;
  files: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19;
};

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

//currently supported pieces, should change to use Role to accept all new peices.
export const ROLES = [
  'a-piece',
  'b-piece',
  'c-piece',
  'd-piece',
  'e-piece',
  'f-piece',
  'g-piece',
  'h-piece',
  'i-piece',
  'j-piece',
  'k-piece',
  'l-piece',
  'm-piece',
  'n-piece',
  'o-piece',
  'p-piece',
  'q-piece',
  'r-piece',
  's-piece',
  't-piece',
  'u-piece',
  'v-piece',
  'w-piece',
  'x-piece',
  'y-piece',
  'z-piece',
  'pp-piece',
  'pl-piece',
  'pn-piece',
  'ps-piece',
  'pb-piece',
  'pr-piece',
  's1-piece',
  's2-piece',
  's3-piece',
  's4-piece',
  's5-piece',
  's6-piece',
  's7-piece',
  's8-piece',
  's9-piece',
  's10-piece',
  's11-piece',
  's12-piece',
  's13-piece',
  's14-piece',
  's15-piece',
  's16-piece',
  's17-piece',
  's18-piece',
  's19-piece',
  's20-piece',
  's21-piece',
  's22-piece',
  's23-piece',
  's24-piece',
  's25-piece',
  's26-piece',
  's27-piece',
  's28-piece',
  's29-piece',
  's30-piece',
  's31-piece',
  's32-piece',
  's33-piece',
  's34-piece',
  's35-piece',
  's36-piece',
  's37-piece',
  's38-piece',
  's39-piece',
  's40-piece',
  's41-piece',
  's42-piece',
  's43-piece',
  's44-piece',
  's45-piece',
  's46-piece',
  's47-piece',
  's48-piece',
] as const;
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
] as const;

export const stoneCounts = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
] as const;

export type Letter = typeof letters[number];
export type StoneCount = typeof stoneCounts[number];
export type Role = `${Letter}-piece` | `p${Letter}-piece` | `s${StoneCount}-piece`;

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
  'monster',
  'scrambledeggs',
  'linesofaction',
  'shogi',
  'minishogi',
  'xiangqi',
  'minixiangqi',
  'flipello',
  'flipello10',
  'amazons',
  'oware',
  'togyzkumalak',
  'go9x9',
  'go13x13',
  'go19x19',
  'backgammon',
  'nackgammon',
  'breakthrough',
  'minibreakthrough',
] as const;

export type Rules = typeof RULES[number];

export interface Outcome {
  winner: PlayerIndex | undefined;
}

// From: https://stackoverflow.com/questions/41139763/how-to-declare-a-fixed-length-array-in-typescript
export type Tuple<T, N extends number, R extends readonly T[] = []> = R['length'] extends N
  ? R
  : Tuple<T, N, readonly [T, ...R]>;
