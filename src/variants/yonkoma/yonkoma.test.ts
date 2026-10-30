import { expect, test } from '@jest/globals';
import { variantClassFromKey, variantKeyToRules } from '../util';
import { GameFamilyKey, NotationStyle, VariantKey } from '../types';
import { Yonkoma10x10 } from './Yonkoma10x10';
import { Yonkoma12x12 } from './Yonkoma12x12';

test('yonkoma variants map to their own rules and board sizes', () => {
  expect(variantKeyToRules(VariantKey.yonkoma10x10)).toBe('yonkoma10x10');
  expect(variantKeyToRules(VariantKey.yonkoma12x12)).toBe('yonkoma12x12');
  expect(variantClassFromKey('yonkoma10x10')).toBe(Yonkoma10x10);
  expect(variantClassFromKey('yonkoma12x12')).toBe(Yonkoma12x12);
  expect(Yonkoma10x10.width).toBe(10);
  expect(Yonkoma10x10.height).toBe(10);
  expect(Yonkoma12x12.width).toBe(12);
  expect(Yonkoma12x12.height).toBe(12);
  expect(Yonkoma10x10.family).toBe(GameFamilyKey.yonkoma);
  expect(Yonkoma10x10.getVariantKeys()).toEqual([VariantKey.yonkoma10x10, VariantKey.yonkoma12x12]);
});

test('yonkoma moves are written as uci and a skipped turn as PASS', () => {
  const info = (uci: string) => ({ san: 'NOSAN', uci, fen: '', prevFen: '' });
  expect(Yonkoma10x10.getNotationStyle()).toBe(NotationStyle.uci);
  expect(Yonkoma10x10.computeMoveNotation(info('a1e5'))).toBe('a1e5');
  expect(Yonkoma12x12.computeMoveNotation(info('l12a1'))).toBe('l12a1');
  expect(Yonkoma10x10.computeMoveNotation(info('pass'))).toBe('PASS');
});

test('a pass has no squares to read', () => {
  expect(Yonkoma10x10.parseLexicalUci('pass')).toBeUndefined();
  expect(Yonkoma10x10.parseLexicalUci('a1e5')).toEqual({ from: 'a1', to: 'e5', promotion: undefined });
});
