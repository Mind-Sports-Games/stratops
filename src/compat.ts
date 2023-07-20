import { Rules, SquareName, Move, isDrop } from './types';
import { makeSquare, squareFile } from './util';
import { Position } from './chess';

export interface ChessgroundDestsOpts {
  chess960?: boolean;
}

export function chessgroundDests(pos: Position, opts?: ChessgroundDestsOpts): Map<SquareName, SquareName[]> {
  const result = new Map();
  const ctx = pos.ctx();
  for (const [from, squares] of pos.allDests(ctx)) {
    if (squares.nonEmpty()) {
      const d = Array.from(squares, makeSquare);
      if (!opts?.chess960 && from === ctx.king && squareFile(from) === 4) {
        // Chessground needs both types of castling dests and filters based on
        // a rookCastles setting.
        if (squares.has(0)) d.push('c1');
        else if (squares.has(56)) d.push('c8');
        if (squares.has(7)) d.push('g1');
        else if (squares.has(63)) d.push('g8');
      }
      result.set(makeSquare(from), d);
    }
  }
  return result;
}

export function chessgroundMove(move: Move): SquareName[] {
  return isDrop(move) ? [makeSquare(move.to)] : [makeSquare(move.from), makeSquare(move.to)];
}

export function scalachessCharPair(move: Move): string {
  // TODO: Update this once we have it in scala chess.
  if (isDrop(move))
    return String.fromCharCode(
      35 + move.to,
      35 + 64 + 8 * 5 + ['q-piece', 'r-piece', 'b-piece', 'n-piece', 'p-piece'].indexOf(move.role)
    );
  else
    return String.fromCharCode(
      35 + move.from,
      move.promotion
        ? 35 +
            64 +
            8 * ['q-piece', 'r-piece', 'b-piece', 'n-piece', 'k-piece'].indexOf(move.promotion) +
            squareFile(move.to)
        : 35 + move.to
    );
}

export function playstrategyRules(
  variant:
    | 'standard'
    | 'chess960'
    | 'antichess'
    | 'fromPosition'
    | 'kingOfTheHill'
    | 'threeCheck'
    | 'fiveCheck'
    | 'atomic'
    | 'horde'
    | 'racingKings'
    | 'crazyhouse'
    | 'noCastling'
    | 'linesOfAction'
    | 'scrambledEggs'
    | 'shogi'
    | 'minishogi'
    | 'xiangqi'
    | 'minixiangqi'
    | 'flipello'
    | 'flipello10'
    | 'amazons'
    | 'oware'
    | 'togyzkumalak'
    | 'go9x9'
    | 'go13x13'
    | 'go19x19'
): Rules {
  switch (variant) {
    case 'standard':
    case 'chess960':
    case 'fromPosition':
      return 'chess';
    case 'threeCheck':
      return '3check';
    case 'fiveCheck':
      return '5check';
    case 'kingOfTheHill':
      return 'kingofthehill';
    case 'racingKings':
      return 'racingkings';
    case 'noCastling':
      return 'nocastling';
    case 'linesOfAction':
      return 'linesofaction';
    case 'scrambledEggs':
      return 'scrambledeggs';
    default:
      return variant;
  }
}

export function playstrategyVariants(
  rules: Rules
):
  | 'standard'
  | 'antichess'
  | 'kingOfTheHill'
  | 'threeCheck'
  | 'fiveCheck'
  | 'atomic'
  | 'horde'
  | 'racingKings'
  | 'crazyhouse'
  | 'noCastling'
  | 'linesOfAction'
  | 'scrambledEggs'
  | 'shogi'
  | 'minishogi'
  | 'xiangqi'
  | 'minixiangqi'
  | 'flipello'
  | 'flipello10'
  | 'amazons'
  | 'oware'
  | 'togyzkumalak'
  | 'go9x9'
  | 'go13x13'
  | 'go19x19' {
  switch (rules) {
    case 'chess':
      return 'standard';
    case '3check':
      return 'threeCheck';
    case '5check':
      return 'fiveCheck';
    case 'kingofthehill':
      return 'kingOfTheHill';
    case 'racingkings':
      return 'racingKings';
    case 'nocastling':
      return 'noCastling';
    case 'linesofaction':
      return 'linesOfAction';
    case 'scrambledeggs':
      return 'scrambledEggs';
    default:
      return rules;
  }
}
