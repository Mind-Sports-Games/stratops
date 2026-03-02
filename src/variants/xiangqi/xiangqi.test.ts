import { describe, expect, it } from '@jest/globals';
import { GameFamily as XiangqiGameFamily } from './GameFamily';
import { MiniXiangqi } from './MiniXiangqi';

describe('Xiangqi', () => {
  it('king cannot leave palace', () => {
    // king at (4,0) (center of bottom palace)
    const width = 9, height = 10;
    let kingSquare = 4; // file 4, rank 0
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

    kingSquare = 4 + 9 * 9; // file 4, rank 9
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
    const width = 5, height = 6;
    let kingSquare = 2; // file 2, rank 0
    let kingMoves = MiniXiangqi.kingAttacks(kingSquare);
    for (const sq of kingMoves) {
      const file = sq % width;
      const rank = Math.floor(sq / width);
      expect(file).toBeGreaterThanOrEqual(1);
      expect(file).toBeLessThanOrEqual(3);
      expect(rank).toBeGreaterThanOrEqual(0);
      expect(rank).toBeLessThanOrEqual(2);
    }

    kingSquare = 2 + 5 * 5; // file 2, rank 5
    kingMoves = MiniXiangqi.kingAttacks(kingSquare);
    for (const sq of kingMoves) {
      const file = sq % width;
      const rank = Math.floor(sq / width);
      expect(file).toBeGreaterThanOrEqual(1);
      expect(file).toBeLessThanOrEqual(3);
      expect(rank).toBeGreaterThanOrEqual(3);
      expect(rank).toBeLessThanOrEqual(5);
    }
  });
});
