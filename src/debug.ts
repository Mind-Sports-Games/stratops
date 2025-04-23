import type { Board } from './board.js';
import type { Position } from './chess.js';
import { makePiece } from './fen.js';
import { SquareSet } from './squareSet.js';
import { type Piece, type Role, ROLES, type Rules, type Square } from './types.js';
import { makeSquare, makeUci, opposite, squareRank } from './util.js';

export function squareSet(squares: SquareSet): string {
  const r = [];
  for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const square = x + y * 8;
      r.push(squares.has(square) ? '1' : '.');
      r.push(x < 7 ? ' ' : '\n');
    }
  }
  return r.join('');
}

export function piece(piece: Piece): string {
  return makePiece(piece);
}

export function board(board: Board): string {
  const r = [];
  for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const square = x + y * 8;
      const p = board.get(square);
      const col = p ? piece(p) : '.';
      r.push(col);
      r.push(x < 7 ? (col.length < 2 ? ' ' : '') : '\n');
    }
  }
  return r.join('');
}

export const square = (rules: Rules) => (sq: Square): string => {
  return makeSquare(rules)(sq);
};

export const dests = (rules: Rules) => (dests: Map<Square, SquareSet>): string => {
  const lines = [];
  for (const [from, to] of dests) {
    lines.push(`${makeSquare(rules)(from)}: ${Array.from(to, square(rules)).join(' ')}`);
  }
  return lines.join('\n');
};

export const perft = (rules: Rules) => (pos: Position, depth: number, log = false): number => {
  if (depth < 1) return 1;

  const promotionRoles: Role[] = ['q-piece', 'n-piece', 'r-piece', 'b-piece'];
  if (pos.rules === 'antichess') promotionRoles.push('k-piece');

  const ctx = pos.ctx();
  const dropDests = pos.dropDests(ctx);

  if (!log && depth === 1 && dropDests.isEmpty()) {
    // Optimization for leaf nodes.
    let nodes = 0;
    for (const [from, to] of pos.allDests(ctx)) {
      nodes += to.size();
      if (pos.board['p-piece'].has(from)) {
        const backrank = SquareSet.backrank64(opposite(pos.turn));
        nodes += to.intersect(backrank).size() * (promotionRoles.length - 1);
      }
    }
    return nodes;
  } else {
    let nodes = 0;
    for (const [from, dests] of pos.allDests(ctx)) {
      const promotions: Array<Role | undefined> =
        squareRank(rules)(from) === (pos.turn === 'p1' ? 6 : 1) && pos.board['p-piece'].has(from)
          ? promotionRoles
          : [undefined];
      for (const to of dests) {
        for (const promotion of promotions) {
          const child = pos.clone();
          const move = { from, to, promotion };
          child.play(move);
          const children = perft(rules)(child, depth - 1, false);
          if (log) console.log(makeUci(rules)(move), children);
          nodes += children;
        }
      }
    }
    if (pos.pockets) {
      for (const role of ROLES) {
        if (pos.pockets[pos.turn][role] > 0) {
          for (const to of role === 'p-piece' ? dropDests.diff64(SquareSet.backranks64()) : dropDests) {
            const child = pos.clone();
            const move = { role, to };
            child.play(move);
            const children = perft(rules)(child, depth - 1, false);
            if (log) console.log(makeUci(rules)(move), children);
            nodes += children;
          }
        }
      }
    }
    return nodes;
  }
};
