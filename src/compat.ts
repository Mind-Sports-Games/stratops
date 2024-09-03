import { Position } from './chess.js';
import { makeFen, parseFen } from './fen.js';
import { isDrop, Move, Rules, SquareName } from './types.js';
import { makeSquare, squareFile } from './util.js';
import { setupPosition } from './variant.js';

export interface ChessgroundDestsOpts {
  chess960?: boolean;
}

export const chessgroundDests =
  (rules: Rules) => (pos: Position, opts?: ChessgroundDestsOpts): Map<SquareName, SquareName[]> => {
    const result = new Map();
    const ctx = pos.ctx();
    for (const [from, squares] of pos.allDests(ctx)) {
      if (squares.nonEmpty()) {
        const d = Array.from(squares, makeSquare(rules));
        if (!opts?.chess960 && from === ctx.king && squareFile(rules)(from) === 4) {
          // Chessground needs both types of castling dests and filters based on
          // a rookCastles setting.
          if (squares.has(0)) d.push('c1');
          else if (squares.has(56)) d.push('c8');
          if (squares.has(7)) d.push('g1');
          else if (squares.has(63)) d.push('g8');
        }
        result.set(makeSquare(rules)(from), d);
      }
    }
    return result;
  };

export const chessgroundMove = (rules: Rules) => (move: Move): SquareName[] => {
  return isDrop(move) ? [makeSquare(rules)(move.to)] : [makeSquare(rules)(move.from), makeSquare(rules)(move.to)];
};

export const scalachessCharPair = (rules: Rules) => (move: Move): string => {
  // TODO: Update this once we have it in scala chess.
  if (isDrop(move)) {
    return String.fromCharCode(
      35 + move.to,
      35 + 64 + 8 * 5 + ['q-piece', 'r-piece', 'b-piece', 'n-piece', 'p-piece'].indexOf(move.role),
    );
  } else {
    return String.fromCharCode(
      35 + move.from,
      move.promotion
        ? 35
          + 64
          + 8 * ['q-piece', 'r-piece', 'b-piece', 'n-piece', 'k-piece'].indexOf(move.promotion)
          + squareFile(rules)(move.to)
        : 35 + move.to,
    );
  }
};

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
    | 'monster'
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
    | 'bestemshe'
    | 'go9x9'
    | 'go13x13'
    | 'go19x19'
    | 'backgammon'
    | 'nackgammon'
    | 'breakthroughtroyka'
    | 'minibreakthroughtroyka'
    | 'abalone',
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
    case 'breakthroughtroyka':
      return 'breakthrough';
    case 'minibreakthroughtroyka':
      return 'minibreakthrough';
    default:
      return variant;
  }
}

export function playstrategyVariants(
  rules: Rules,
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
  | 'monster'
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
  | 'bestemshe'
  | 'go9x9'
  | 'go13x13'
  | 'go19x19'
  | 'backgammon'
  | 'nackgammon'
  | 'breakthrough'
  | 'minibreakthrough'
  | 'abalone'
{
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

export const amazonsChessgroundFen = (fen: string): string => {
  // TODO: remove the unwraps
  const setup = parseFen('amazons')(fen).unwrap();
  const game = setupPosition('amazons', setup).unwrap();
  return makeFen('amazons')(game.toSetup(), { promoted: true });
};
