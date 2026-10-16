import { describe, expect, it, test } from '@jest/globals';
import { getScoreFromFen } from './score.js';
import { VariantKey } from './types.js';
import { variantClassFromKey } from './util.js';

type Case = { keys: `${VariantKey}`[]; fen: string; p1: number; p2: number };

// One FEN per scored family, with distinct non-zero scores so a shifted or swapped field fails.
const CASES: Case[] = [
  {
    keys: ['flipello', 'flipello10', 'antiflipello', 'octagonflipello'],
    // Discs still in the pocket must not be counted.
    fen: `8/8/8/3PP3/2PPp3/8/8/8[${'P'.repeat(76)}${'p'.repeat(74)}] w - - 0 1`,
    p1: 4,
    p2: 1,
  },
  {
    keys: ['go9x9', 'go13x13', 'go19x19'],
    fen: '9/9/9/9/9/9/9/9/9[SSSSSSSSSSssssssssss] b - 120 75 0 0 55 0 1',
    p1: 12,
    p2: 7.5,
  },
  { keys: ['oware'], fen: '4S,4S,4S,4S,4S,4S/4S,4S,4S,4S,4S,4S 7 4 S 1', p1: 7, p2: 4 },
  {
    keys: ['togyzkumalak', 'bestemshe'],
    fen: '9S,9S,9S,9S,9S,9S,9S,9S,9S/9S,9S,9S,9S,9S,9S,9S,9S,9S 23 15 S 0',
    p1: 23,
    p2: 15,
  },
  { keys: ['abalone', 'grandabalone'], fen: 'ss1SS/sssSSS/1ss1SS1/8/9/8/1SS1ss1/SSSsss/SS1ss 3 1 b 0 1', p1: 3, p2: 1 },
  {
    keys: ['backgammon', 'hyper', 'nackgammon'],
    fen: '5S,3,3s,1,5s,4,2S/5s,3,3S,1,5S,4,2s[] - - b 4 9 - 1',
    p1: 4,
    p2: 9,
  },
  { keys: ['entropy'], fen: '7/7/7/7/7/7/7[] w 12 7 2 50', p1: 12, p2: 7 },
  { keys: ['fiveCheck'], fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 +2+3', p1: 2, p2: 3 },
];

const UNSCORED_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const fenFor = (key: string): string => CASES.find(c => c.keys.includes(key as `${VariantKey}`))?.fen ?? UNSCORED_FEN;

const scoredCases: Array<[`${VariantKey}`, Case]> = CASES.flatMap(c =>
  c.keys.map((key): [`${VariantKey}`, Case] => [key, c])
);

describe('score', () => {
  test.each(scoredCases)('%s reads the expected scores', (key, { fen, p1, p2 }) => {
    expect(getScoreFromFen(key, fen, 'p1')).toBe(p1);
    expect(getScoreFromFen(key, fen, 'p2')).toBe(p2);
  });

  test.each(scoredCases)('%s variant class reads the same scores', (key, { fen, p1, p2 }) => {
    const variant = variantClassFromKey(key);
    expect(variant.getScoreFromFen(fen, 'p1')).toBe(p1);
    expect(variant.getScoreFromFen(fen, 'p2')).toBe(p2);
  });

  it('scores the families that have a score, and only those', () => {
    const scored = Object.values(VariantKey).filter(key => getScoreFromFen(key, fenFor(key), 'p1') !== undefined);
    expect(scored.sort()).toEqual(
      [
        'abalone',
        'antiflipello',
        'backgammon',
        'bestemshe',
        'entropy',
        'fiveCheck',
        'flipello',
        'flipello10',
        'go13x13',
        'go19x19',
        'go9x9',
        'grandabalone',
        'hyper',
        'nackgammon',
        'octagonflipello',
        'oware',
        'togyzkumalak',
      ].sort(),
    );
  });
});
