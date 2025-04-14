import { expect, test } from '@jest/globals';
import { makeFen, parseFen } from '../../fen';
import { MiniShogi } from './MiniShogi';

test('promoted rook can move as dragon', () => {
  const pos = MiniShogi.fromSetup(parseFen('minishogi')('rbsgk/4p/5/P4/KGSBR[] w - - 0 1').unwrap()).unwrap(); // initial position

  const pUp = pos.clone();
  pUp.play({ from: 5, to: 10 });
  expect(makeFen('minishogi')(pUp.toSetup())).toBe('rbsgk/4p/P4/5/KGSBR[] b - - 1 1');

  const rDownCheck = pUp.clone();
  rDownCheck.play({ from: 20, to: 10 });
  expect(makeFen('minishogi')(rDownCheck.toSetup())).toBe('1bsgk/4p/r4/5/KGSBR[p] w - - 0 2');

  const kEscapes = rDownCheck.clone();
  kEscapes.play({ from: 0, to: 6 });
  expect(makeFen('minishogi')(kEscapes.toSetup())).toBe('1bsgk/4p/r4/1K3/1GSBR[p] b - - 1 2');

  const rPromote = kEscapes.clone();
  rPromote.play({ from: 10, to: 0, promotion: 'pr-piece' });
  expect(makeFen('minishogi')(rPromote.toSetup())).toBe('1bsgk/4p/5/1K3/+rGSBR[p] w - - 2 3'); // was 1bsgk/4p/5/1K3/+rGSBR[p] w - - 0 3 on /analysis

  const kEscapes2 = rPromote.clone();
  kEscapes2.play({ from: 6, to: 7 });
  expect(makeFen('minishogi')(kEscapes2.toSetup())).toBe('1bsgk/4p/5/2K2/+rGSBR[p] b - - 3 3'); // was 1bsgk/4p/5/2K2/+rGSBR[p] b - - 1 3 on /analysis

  const rMovesNowAsDragon = kEscapes2.clone();
  rMovesNowAsDragon.play({ from: 0, to: 6 });
  expect(makeFen('minishogi')(rMovesNowAsDragon.toSetup())).toBe('1bsgk/4p/5/1+rK2/1GSBR[p] w - - 4 4'); // was 1bsgk/4p/5/1+rK2/1GSBR[p] w - - 2 4 on /analysis
});

test('parseUci promotes the piece', () => {
  const pos = MiniShogi.fromSetup(parseFen('minishogi')('rbsgk/4p/5/P4/KGSBR[] w - - 0 1').unwrap()).unwrap(); // initial position

  const move = MiniShogi.parseUci('a2a3', pos.board);
  if (!move) throw new Error('Invalid move');
  expect(move).toEqual({ from: 5, to: 10, promotion: undefined }); // role: 'p-piece',

  pos.play(move);
  expect(makeFen('minishogi')(pos.toSetup())).toBe('rbsgk/4p/P4/5/KGSBR[] b - - 1 1');

  const move2 = MiniShogi.parseUci('a5a3', pos.toSetup().board);
  if (!move2) throw new Error('Invalid move');
  expect(move2).toEqual({ from: 20, to: 10, promotion: undefined });

  pos.play(move2);
  expect(makeFen('minishogi')(pos.toSetup())).toBe('1bsgk/4p/r4/5/KGSBR[p] w - - 0 2');

  const move3 = MiniShogi.parseUci('a1b2', pos.toSetup().board);
  if (!move3) throw new Error('Invalid move');
  expect(move3).toEqual({ from: 0, to: 6, promotion: undefined });

  pos.play(move3);
  expect(makeFen('minishogi')(pos.toSetup())).toBe('1bsgk/4p/r4/1K3/1GSBR[p] b - - 1 2');

  const move4 = MiniShogi.parseUci('a3a1+', pos.toSetup().board);
  if (!move4) throw new Error('Invalid move');
  expect(move4).toEqual({ from: 10, to: 0, promotion: 'pr-piece' });

  pos.play(move4);
  expect(makeFen('minishogi')(pos.toSetup())).toBe('1bsgk/4p/5/1K3/+rGSBR[p] w - - 2 3');
});
