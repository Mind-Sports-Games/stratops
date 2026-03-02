import { expect, test } from '@jest/globals';
import { parseFen } from '../../fen';
import { variantClassFromKey, variantKeyToRules } from '../util';

test('variantKeyToRules is not just returning chess', () => {
  expect(variantKeyToRules('atomic')).toBe('atomic');
});

test('atomic setup when in check but game over', () => {
  // fen from atomic ending while still in check
  const fen = 'r3kb1r/pp5p/3pQpp1/4p3/4P3/8/PPPP2PP/R1B4R w kq - 0 8';
  const setup = parseFen('atomic')(fen).unwrap();
  const position = variantClassFromKey('atomic').fromSetup(setup).unwrap();
  expect(position.isEnd()).toBe(true);
});
