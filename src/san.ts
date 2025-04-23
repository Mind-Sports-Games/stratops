// TODO: SAN isn't really great for other games, should we bother implementing it?
import { attacks, bishopAttacks, kingAttacks, knightAttacks, queenAttacks, rookAttacks } from './attacks.js';
import type { Position } from './chess.js';
import { SquareSet } from './squareSet.js';
import { type CastlingSide, FILE_NAMES, isDrop, type Move, RANK_NAMES, type Rules } from './types.js';
import { charToRole, defined, makeSquare, opposite, parseSquare, roleToChar, squareFile, squareRank } from './util.js';

const makeSanWithoutSuffix = (rules: Rules) => (pos: Position, move: Move): string => {
  let san = '';
  if (isDrop(move)) {
    if (move.role !== 'p-piece') san = roleToChar(move.role).toUpperCase();
    san += '@' + makeSquare(rules)(move.to);
  } else {
    const role = pos.board.getRole(move.from);
    if (!role) return '--';
    if (role === 'k-piece' && (pos.board[pos.turn].has(move.to) || Math.abs(move.to - move.from) === 2)) {
      san = move.to > move.from ? 'O-O' : 'O-O-O';
    } else {
      const capture = pos.board.occupied.has(move.to)
        || (role === 'p-piece' && squareFile(rules)(move.from) !== squareFile(rules)(move.to));
      if (role !== 'p-piece') {
        san = roleToChar(role).toUpperCase();

        // Disambiguation
        let others;
        if (role === 'k-piece') others = kingAttacks(move.to).intersect(pos.board['k-piece']);
        else if (role === 'q-piece') {
          others = queenAttacks(move.to, pos.board.occupied).intersect(pos.board['q-piece']);
        } else if (role === 'r-piece') {
          others = rookAttacks(move.to, pos.board.occupied).intersect(pos.board['r-piece']);
        } else if (role === 'b-piece') {
          others = bishopAttacks(move.to, pos.board.occupied).intersect(pos.board['b-piece']);
        } else others = knightAttacks(move.to).intersect(pos.board['n-piece']);
        others = others.intersect(pos.board[pos.turn]).without(move.from);
        if (others.nonEmpty()) {
          const ctx = pos.ctx();
          for (const from of others) {
            if (!pos.dests(from, ctx).has(move.to)) others = others.without(from);
          }
          if (others.nonEmpty()) {
            let row = false;
            let column = others.intersects(SquareSet.fromRank64(squareRank(rules)(move.from)));
            if (others.intersects(SquareSet.fromFile64(squareFile(rules)(move.from)))) row = true;
            else column = true;
            if (column) san += FILE_NAMES[squareFile(rules)(move.from)];
            if (row) san += RANK_NAMES[squareRank(rules)(move.from)];
          }
        }
      } else if (capture) san = FILE_NAMES[squareFile(rules)(move.from)];

      if (capture) san += 'x';
      san += makeSquare(rules)(move.to);
      if (move.promotion) san += '=' + roleToChar(move.promotion).toUpperCase();
    }
  }
  return san;
};

export const makeSanAndPlay = (rules: Rules) => (pos: Position, move: Move): string => {
  const san = makeSanWithoutSuffix(rules)(pos, move);
  pos.play(move);
  if (pos.outcome()?.winner) return san + '#';
  if (pos.isCheck()) return san + '+';
  return san;
};

export const makeSanVariation = (rules: Rules) => (pos: Position, variation: Move[]): string => {
  pos = pos.clone();
  const line = [];
  for (let i = 0; i < variation.length; i++) {
    if (i !== 0) line.push(' ');
    if (pos.turn === 'p1') line.push(pos.fullmoves, '. ');
    else if (i === 0) line.push(pos.fullmoves, '... ');
    const san = makeSanWithoutSuffix(rules)(pos, variation[i]);
    pos.play(variation[i]);
    line.push(san);
    if (san === '--') return line.join('');
    if (i === variation.length - 1 && pos.outcome()?.winner) line.push('#');
    else if (pos.isCheck()) line.push('+');
  }
  return line.join('');
};

export const makeSan = (rules: Rules) => (pos: Position, move: Move): string => {
  return makeSanAndPlay(rules)(pos.clone(), move);
};

export const parseSan = (rules: Rules) => (pos: Position, san: string): Move | undefined => {
  const ctx = pos.ctx();

  // Castling
  let castlingSide: CastlingSide | undefined;
  if (san === 'O-O' || san === 'O-O+' || san === 'O-O#') castlingSide = 'h';
  else if (san === 'O-O-O' || san === 'O-O-O+' || san === 'O-O-O#') castlingSide = 'a';
  if (castlingSide) {
    const rook = pos.castles.rook[pos.turn][castlingSide];
    if (!defined(ctx.king) || !defined(rook) || !pos.dests(ctx.king, ctx).has(rook)) return;
    return {
      from: ctx.king,
      to: rook,
    };
  }

  // Normal move
  const match = san.match(/^([NBRQK])?([a-h])?([1-8])?[-x]?([a-h][1-8])(?:=?([nbrqkNBRQK]))?[+#]?$/);
  if (!match) {
    // Drop
    const match = san.match(/^([pnbrqkPNBRQK])?@([a-h][1-8])[+#]?$/);
    if (!match) return;
    const move = {
      role: charToRole(match[1]) || 'p-piece',
      to: parseSquare(rules)(match[2])!,
    };
    return pos.isLegal(move, ctx) ? move : undefined;
  }
  const role = charToRole(match[1]) || 'p-piece';
  const to = parseSquare(rules)(match[4])!;

  const promotion = charToRole(match[5]);
  if (!!promotion !== (role === 'p-piece' && SquareSet.backranks64().has(to))) return;
  if (promotion === 'k-piece' && pos.rules !== 'antichess') return;

  let candidates = pos.board.pieces(pos.turn, role);
  if (match[2]) candidates = candidates.intersect(SquareSet.fromFile64(match[2].charCodeAt(0) - 'a'.charCodeAt(0)));
  if (match[3]) candidates = candidates.intersect(SquareSet.fromRank64(match[3].charCodeAt(0) - '1'.charCodeAt(0)));

  // Optimization: Reduce set of candidates
  const pawnAdvance = role === 'p-piece' ? SquareSet.fromFile64(squareFile(rules)(to)) : SquareSet.empty();
  candidates = candidates.intersect(
    pawnAdvance.union(
      attacks({ playerIndex: opposite(pos.turn), role }, to, pos.board.occupied, pos.board.p1, pos.board.p2),
    ),
  );

  // Check uniqueness and legality
  let from;
  for (const candidate of candidates) {
    if (pos.dests(candidate, ctx).has(to)) {
      if (defined(from)) return; // Ambiguous
      from = candidate;
    }
  }
  if (!defined(from)) return; // Illegal

  return {
    from,
    to,
    promotion,
  };
};
