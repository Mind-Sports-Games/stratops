import { describe, expect, it, test } from '@jest/globals';
import { getScoreFromFen } from './score.js';
import { VariantKey } from './types.js';
import { variantClassFromKey } from './util.js';

const FENS: Partial<Record<`${VariantKey}`, string>> = {
  entropy: 'Rk5/7/3y3/7/7/7/6P[g] b 3 0 1 5',
  fiveCheck: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 +0+0',
  flipello:
    '8/8/8/3pP3/3Pp3/8/8/8[PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp] w - - 0 1',
  go9x9: '9/9/9/9/9/9/9/9/9[SSSSSSSSSSssssssssss] b - 0 55 0 0 55 0 1',
  oware: '4S,4S,4S,4S,4S,4S/4S,4S,4S,4S,4S,4S 0 0 S 1',
  togyzkumalak: '9S,9S,9S,9S,9S,9S,9S,9S,9S/9S,9S,9S,9S,9S,9S,9S,9S,9S 0 0 S 0',
  abalone: 'ss1SS/sssSSS/1ss1SS1/8/9/8/1SS1ss1/SSSsss/SS1ss 0 0 b 0 1',
  backgammon: '5S,3,3s,1,5s,4,2S/5s,3,3S,1,5S,4,2s[] - - b 0 0 - 1',
};

const FAMILY_FEN: Array<[string[], string]> = [
  [['flipello', 'flipello10', 'antiflipello', 'octagonflipello'], FENS.flipello!],
  [['go9x9', 'go13x13', 'go19x19'], FENS.go9x9!],
  [['togyzkumalak', 'bestemshe'], FENS.togyzkumalak!],
  [['abalone', 'grandabalone'], FENS.abalone!],
  [['backgammon', 'hyper', 'nackgammon'], FENS.backgammon!],
  [['oware'], FENS.oware!],
  [['entropy'], FENS.entropy!],
  [['fiveCheck'], FENS.fiveCheck!],
];

const fenFor = (key: string): string =>
  FAMILY_FEN.find(([keys]) => keys.includes(key))?.[1] ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('score', () => {
  test.each(Object.values(VariantKey))('%s reads the same score as its variant class', (key: VariantKey) => {
    const fen = fenFor(key);
    for (const playerIndex of ['p1', 'p2']) {
      expect(getScoreFromFen(key, fen, playerIndex)).toEqual(
        variantClassFromKey(key).getScoreFromFen(fen, playerIndex),
      );
    }
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
