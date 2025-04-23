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
  dpg = 'dpg',
  dpo = 'dpo',
  man = 'man',
  san = 'san',
  uci = 'uci',
  usi = 'usi',
  wxf = 'wxf',
}
