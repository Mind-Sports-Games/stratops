import { describe, expect, it } from '@jest/globals';
import { GameFamily as XiangqiGameFamily } from './GameFamily';
import { MiniXiangqi } from './MiniXiangqi';

describe('Xiangqi', () => {
  it('king cannot leave palace', () => {
    const width = 9, height = 10;
    let kingSquare = 4; // center column of first rank
    let kingMoves = XiangqiGameFamily.kingAttacks(kingSquare);
    // Should only allow moves within palace (files 3-5, ranks 0-2)
    for (const sq of kingMoves) {
      const file = sq % width;
      const rank = Math.floor(sq / width);
      expect(file).toBeGreaterThanOrEqual(3);
      expect(file).toBeLessThanOrEqual(5);
      expect(rank).toBeGreaterThanOrEqual(0);
      expect(rank).toBeLessThanOrEqual(2);
    }

    kingSquare = 4 + 9 * 9; // center column of last rank
    kingMoves = XiangqiGameFamily.kingAttacks(kingSquare);
    for (const sq of kingMoves) {
      const file = sq % width;
      const rank = Math.floor(sq / width);
      expect(file).toBeGreaterThanOrEqual(3);
      expect(file).toBeLessThanOrEqual(5);
      expect(rank).toBeGreaterThanOrEqual(7);
      expect(rank).toBeLessThanOrEqual(9);
    }
  });
});

describe('MiniXiangqi', () => {
  it('king cannot leave palace', () => {
    let kingSquare = 3; // center column of first rank
    let kingMoves = MiniXiangqi.kingAttacks(kingSquare);
    for (const sq of kingMoves) {
      const file = sq % MiniXiangqi.width;
      const rank = Math.floor(sq / MiniXiangqi.width);
      expect(file).toBeGreaterThanOrEqual(2);
      expect(file).toBeLessThanOrEqual(4);
      expect(rank).toBeGreaterThanOrEqual(0);
      expect(rank).toBeLessThanOrEqual(2);
    }

    kingSquare = 3 + 7 * 7; // center column of last rank
    kingMoves = MiniXiangqi.kingAttacks(kingSquare);
    for (const sq of kingMoves) {
      const file = sq % MiniXiangqi.width;
      const rank = Math.floor(sq / MiniXiangqi.width);
      expect(file).toBeGreaterThanOrEqual(2);
      expect(file).toBeLessThanOrEqual(4);
      expect(rank).toBeGreaterThanOrEqual(4);
      expect(rank).toBeLessThanOrEqual(6);
    }
  });
});
