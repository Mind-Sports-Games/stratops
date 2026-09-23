// Score readers without the variant registry.
import type { VariantKey } from './types';

export type ScoreReader = (fen: string, playerIndex: string) => number | undefined;

const othello: ScoreReader = (fen, playerIndex) => {
  const boardPart = fen.split(' ')[0].split('[')[0];
  return boardPart.split(playerIndex === 'p1' ? 'P' : 'p').length - 1;
};

const go: ScoreReader = (fen, playerIndex) => +fen.split(' ')[playerIndex === 'p1' ? 3 : 4] / 10.0;

const oware: ScoreReader = (fen, playerIndex) => +fen.split(' ')[playerIndex === 'p1' ? 1 : 2];

const togyzkumalak: ScoreReader = (fen, playerIndex) => +fen.split(' ')[playerIndex === 'p1' ? 1 : 2];

const abalone: ScoreReader = (fen, playerIndex) => +fen.split(' ')[playerIndex === 'p1' ? 1 : 2];

const backgammon: ScoreReader = (fen, playerIndex) => +fen.split(' ')[playerIndex === 'p1' ? 4 : 5];

const fiveCheck: ScoreReader = (fen, playerIndex) => +fen.split(' ')[6][playerIndex === 'p1' ? 1 : 3];

const readers: Partial<Record<`${VariantKey}`, ScoreReader>> = {
  fiveCheck,
  flipello: othello,
  flipello10: othello,
  antiflipello: othello,
  octagonflipello: othello,
  go9x9: go,
  go13x13: go,
  go19x19: go,
  oware,
  togyzkumalak,
  bestemshe: togyzkumalak,
  abalone,
  grandabalone: abalone,
  backgammon,
  hyper: backgammon,
  nackgammon: backgammon,
};

export function getScoreFromFen(variantKey: string, fen: string, playerIndex: string): number | undefined {
  return readers[variantKey as `${VariantKey}`]?.(fen, playerIndex);
}
