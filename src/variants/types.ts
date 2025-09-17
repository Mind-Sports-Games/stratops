import { Role } from '../types';

export interface ExtendedMoveInfo {
  san: string;
  uci: string;
  fen: string;
  prevFen: string;
}

export interface ParsedMove {
  dest: string;
  orig: string;
}

export type LexicalUci = {
  from: Key;
  to: Key;
  dropRole?: Role;
  promotion?: Role;
};

type File = (typeof files)[number];
type Rank = (typeof ranks19)[number];
const files = [
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
const ranks19 = [
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

export type Key = 'a0' | `${File}${Rank}`;

export interface LegacyNotationBoard { // comes from lila/ui/common/notation
  pieces: { [key: string]: string };
  wMoved: boolean;
}

export enum NotationStyle {
  abl = 'abl',
  bkg = 'bkg',
  dmo = 'dmo',
  dpg = 'dpg',
  dpo = 'dpo',
  man = 'man',
  san = 'san',
  uci = 'uci',
  usi = 'usi',
  wxf = 'wxf',
}

export enum GameFamilyKey {
  chess = 'chess',
  draughts = 'draughts',
  loa = 'loa',
  shogi = 'shogi',
  xiangqi = 'xiangqi',
  flipello = 'flipello',
  amazons = 'amazons',
  breakthroughtroyka = 'breakthroughtroyka',
  oware = 'oware',
  togyzkumalak = 'togyzkumalak',
  go = 'go',
  backgammon = 'backgammon',
  abalone = 'abalone',
  dameo = 'dameo',
}

export enum VariantKey {
  standard = 'standard',
  chess960 = 'chess960',
  antichess = 'antichess',
  fromPosition = 'fromPosition',
  kingOfTheHill = 'kingOfTheHill',
  threeCheck = 'threeCheck',
  fiveCheck = 'fiveCheck',
  atomic = 'atomic',
  horde = 'horde',
  racingKings = 'racingKings',
  crazyhouse = 'crazyhouse',
  noCastling = 'noCastling',
  monster = 'monster',
  linesOfAction = 'linesOfAction',
  scrambledEggs = 'scrambledEggs',
  shogi = 'shogi',
  xiangqi = 'xiangqi',
  minishogi = 'minishogi',
  minixiangqi = 'minixiangqi',
  flipello = 'flipello',
  flipello10 = 'flipello10',
  amazons = 'amazons',
  breakthroughtroyka = 'breakthroughtroyka',
  minibreakthroughtroyka = 'minibreakthroughtroyka',
  oware = 'oware',
  togyzkumalak = 'togyzkumalak',
  bestemshe = 'bestemshe',
  go9x9 = 'go9x9',
  go13x13 = 'go13x13',
  go19x19 = 'go19x19',
  backgammon = 'backgammon',
  hyper = 'hyper',
  nackgammon = 'nackgammon',
  abalone = 'abalone',
  international = 'international',
  antidraughts = 'antidraughts',
  breakthrough = 'breakthrough',
  russian = 'russian',
  brazilian = 'brazilian',
  pool = 'pool',
  portuguese = 'portuguese',
  english = 'english',
  fromPositionDraughts = 'fromPositionDraughts',
  frisian = 'frisian',
  frysk = 'frysk',
  dameo = 'dameo',
}
