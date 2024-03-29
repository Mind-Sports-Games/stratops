import { Result } from '@badrap/result';
import { Move, Piece, Square, PlayerIndex, PLAYERINDEXES, ROLES, FILE_NAMES, Rules } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup, MaterialSide, Material, RemainingChecks } from './setup';
import {
  defined,
  squareFile,
  parseSquare,
  makeSquare,
  roleToChar,
  charToRole,
  dimensionsForRules,
  parseUci,
  makeUci,
} from './util';

export const INITIAL_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
export const INITIAL_EPD = INITIAL_BOARD_FEN + ' w KQkq -';
export const INITIAL_FEN = INITIAL_EPD + ' 0 1';
export const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8';
export const EMPTY_EPD = EMPTY_BOARD_FEN + ' w - -';
export const EMPTY_FEN = EMPTY_EPD + ' 0 1';
export const COMMA_FEN_RULES = ['oware', 'togyzkumalak', 'backgammon', 'nackgammon'];
export const MANCALA_FEN_VARIANT = ['oware', 'togyzkumalak'];

export enum InvalidFen {
  Fen = 'ERR_FEN',
  Board = 'ERR_BOARD',
  Pockets = 'ERR_POCKETS',
  Turn = 'ERR_TURN',
  Castling = 'ERR_CASTLING',
  EpSquare = 'ERR_EP_SQUARE',
  RemainingChecks = 'ERR_REMAINING_CHECKS',
  Halfmoves = 'ERR_HALFMOVES',
  Fullmoves = 'ERR_FULLMOVES',
  MancalaScore = 'ERR_MANCALA_SCORE',
  BackgammonScore = 'ERR_BACKGAMMON_SCORE',
}

export class FenError extends Error {}

function nthIndexOf(haystack: string, needle: string, n: number): number {
  let index = haystack.indexOf(needle);
  while (n-- > 0) {
    if (index === -1) break;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return index;
}

function parseSmallUint(str: string): number | undefined {
  return /^\d{1,4}$/.test(str) ? parseInt(str, 10) : undefined;
}

function charToPiece(ch: string): Piece | undefined {
  const role = charToRole(ch);
  return role && { role, playerIndex: ch.toLowerCase() === ch ? 'p2' : 'p1' };
}

export const parseBoardFen =
  (rules: Rules) =>
  (boardPart: string): Result<Board, FenError> => {
    const board = Board.empty(rules);
    const { ranks, files } = dimensionsForRules(rules);
    let rank = ranks - 1;
    let file = 0;
    if (!COMMA_FEN_RULES.includes(rules)) {
      let skipNext = false;
      for (let i = 0; i < boardPart.length; i++) {
        if (skipNext) {
          skipNext = false;
          continue;
        }
        const c = boardPart[i];
        if (c === '/' && file === files) {
          file = 0;
          rank--;
        } else {
          const step = parseInt(c, 10);
          if (step > 0) {
            // with amazons, we now have fens where two digits must
            // be parsed in a row. We'll use a look ahead here.
            let stepped = false;
            if (files > 9 && i < boardPart.length + 1 && parseInt(boardPart[i + 1]) >= 0) {
              const twoCharStep = parseInt(c + boardPart[i + 1]);
              if (twoCharStep > 0) {
                file += twoCharStep;
                stepped = true;
                skipNext = true;
              }
            }
            if (!stepped) {
              file += step;
            }
          } else {
            if (file >= files || rank < 0) return Result.err(new FenError(InvalidFen.Board));
            const square = file + rank * files;
            const isShogiPromotion = rules === 'shogi' && c === '+' && i + 1 < boardPart.length;
            const pieceChar = isShogiPromotion ? c + boardPart[i + 1] : c;
            if (isShogiPromotion) {
              ++i;
            }
            const piece = charToPiece(pieceChar);
            if (!piece) return Result.err(new FenError(InvalidFen.Board));
            if (boardPart[i + 1] === '~') {
              piece.promoted = true;
              i++;
            }
            board.set(square, piece);
            file++;
          }
        }
      }
    } else {
      for (const r of boardPart.split(' ')[0].split('/')) {
        for (const f of r.split(',')) {
          if (isNaN(+f)) {
            if (file >= files || rank < 0) return Result.err(new FenError(InvalidFen.Board));
            const square = file + rank * files;
            const count = f.slice(0, -1);
            const role = f.substring(f.length - 1).toLowerCase();
            const playerIndex = MANCALA_FEN_VARIANT.includes(rules)
              ? rank === 1
                ? 'p1'
                : 'p2'
              : f.substring(f.length - 1) === role
              ? 'p2'
              : 'p1';
            const piece = {
              role: `${role}${count}-piece`,
              playerIndex: playerIndex,
            } as Piece;
            board.set(square, piece);
            file++;
          } else {
            file += +f;
          }
        }
        if (rank !== 0 && file === files) {
          file = 0;
          rank--;
        }
      }
    }
    if (rank !== 0 || file !== files) return Result.err(new FenError(InvalidFen.Board));
    return Result.ok(board);
  };

export const parsePockets =
  (rules: Rules) =>
  (pocketPart: string): Result<Material, FenError> => {
    // TODO: What would the limit need to be for us right now?
    if (pocketPart.length > 64 * 4) return Result.err(new FenError(InvalidFen.Pockets));
    const pockets = Material.empty();
    if (COMMA_FEN_RULES.includes(rules)) {
      for (const p of pocketPart.split(',')) {
        const count = p.slice(0, -1);
        const role = p.substring(p.length - 1).toLowerCase();
        const playerIndex = p.substring(p.length - 1) === role ? 'p2' : 'p1';
        const piece = {
          role: `${role}${count}-piece`,
          playerIndex: playerIndex,
        } as Piece;
        pockets[piece.playerIndex][piece.role]++;
      }
    } else {
      for (const c of pocketPart) {
        const piece = charToPiece(c);
        if (!piece) return Result.err(new FenError(InvalidFen.Pockets));
        pockets[piece.playerIndex][piece.role]++;
      }
    }
    return Result.ok(pockets);
  };

export function parseCastlingFen(board: Board, castlingPart: string): Result<SquareSet, FenError> {
  let unmovedRooks = SquareSet.empty();
  if (castlingPart === '-') return Result.ok(unmovedRooks);
  if (!/^[KQABCDEFGH]{0,2}[kqabcdefgh]{0,2}$/.test(castlingPart)) {
    return Result.err(new FenError(InvalidFen.Castling));
  }
  for (const c of castlingPart) {
    const lower = c.toLowerCase();
    const playerIndex = c === lower ? 'p2' : 'p1';
    const backrank = SquareSet.backrank64(playerIndex).intersect(board[playerIndex]);
    let candidates: Iterable<Square>;
    if (lower === 'q') candidates = backrank;
    else if (lower === 'k') candidates = backrank.reversed();
    else candidates = SquareSet.fromSquare(lower.charCodeAt(0) - 'a'.charCodeAt(0)).intersect(backrank);
    for (const square of candidates) {
      if (board['k-piece'].has(square) && !board.promoted.has(square)) break;
      if (board['r-piece'].has(square)) {
        unmovedRooks = unmovedRooks.with(square);
        break;
      }
    }
  }
  return Result.ok(unmovedRooks);
}

export function parseRemainingChecks(part: string): Result<RemainingChecks, FenError> {
  const parts = part.split('+');
  if (parts.length === 3 && parts[0] === '') {
    const p1 = parseSmallUint(parts[1]);
    const p2 = parseSmallUint(parts[2]);
    if (!defined(p1) || p1 > 5 || !defined(p2) || p2 > 5) return Result.err(new FenError(InvalidFen.RemainingChecks));
    return Result.ok(new RemainingChecks(5 - p1, 5 - p2)); //Old notation counting down, not used in games, therefore using highest check mode 5
  } else if (parts.length === 2) {
    const p1 = parseSmallUint(parts[0]);
    const p2 = parseSmallUint(parts[1]);
    if (!defined(p1) || p1 > 5 || !defined(p2) || p2 > 5) return Result.err(new FenError(InvalidFen.RemainingChecks));
    return Result.ok(new RemainingChecks(p1, p2));
  } else return Result.err(new FenError(InvalidFen.RemainingChecks));
}

export const parseFen =
  (rules: Rules) =>
  (fen: string): Result<Setup, FenError> => {
    const originalParts = fen.split(' ');
    const lastMoveParts = originalParts.filter(f => f.includes('½'));
    const parts = originalParts.filter(f => !f.includes('½'));
    const boardPart = parts.shift()!;

    // Board and pockets
    let board,
      pockets = Result.ok<Material | undefined, FenError>(undefined);
    const { ranks } = dimensionsForRules(rules);
    if (boardPart.endsWith(']')) {
      const pocketStart = boardPart.indexOf('[');
      if (pocketStart === -1) return Result.err(new FenError(InvalidFen.Fen));
      board = parseBoardFen(rules)(boardPart.substr(0, pocketStart));
      pockets = parsePockets(rules)(boardPart.substr(pocketStart + 1, boardPart.length - 1 - pocketStart - 1));
    } else {
      const pocketStart = nthIndexOf(boardPart, '/', ranks - 1);
      if (pocketStart === -1) board = parseBoardFen(rules)(boardPart);
      else {
        board = parseBoardFen(rules)(boardPart.substr(0, pocketStart));
        pockets = parsePockets(rules)(boardPart.substr(pocketStart + 1));
      }
    }

    let northScore: number | undefined;
    let southScore: number | undefined;
    // Oware scores?
    if (rules === 'oware' || rules === 'togyzkumalak') {
      const southScoreText = parts.shift();
      const northScoreText = parts.shift();
      if (!northScoreText || !southScoreText) return Result.err(new FenError(InvalidFen.MancalaScore));
      southScore = parseSmallUint(southScoreText);
      northScore = parseSmallUint(northScoreText);
    }

    // Backgammon dice
    let unusedDice: string | undefined;
    let usedDice: string | undefined;
    if (rules === 'backgammon' || rules === 'nackgammon') {
      unusedDice = parts.shift();
      usedDice = parts.shift();
    }

    // Turn
    let turn: PlayerIndex;
    const turnPart = parts.shift();
    if (!defined(turnPart) || turnPart === 'w' || turnPart.toLowerCase() === 's') turn = 'p1';
    else if (turnPart === 'b' || turnPart.toLowerCase() === 'n') turn = 'p2';
    else return Result.err(new FenError(InvalidFen.Turn));

    // Backgammon score
    let backgammonP1Score: number | undefined;
    let backgammonP2Score: number | undefined;
    if (rules === 'backgammon' || rules === 'nackgammon') {
      const p1ScoreText = parts.shift();
      const p2ScoreText = parts.shift();
      if (!p1ScoreText || !p2ScoreText) return Result.err(new FenError(InvalidFen.BackgammonScore));
      backgammonP1Score = parseSmallUint(p1ScoreText);
      backgammonP2Score = parseSmallUint(p2ScoreText);
    }

    return board.chain(board => {
      let commaFenFullMoves: number | undefined;
      if (COMMA_FEN_RULES.includes(rules)) {
        const commaFenFullMovesPart = parts.shift();
        commaFenFullMoves = defined(commaFenFullMovesPart) ? parseSmallUint(commaFenFullMovesPart) : 1;
      }

      // Castling
      const castlingPart = parts.shift();
      const unmovedRooks = defined(castlingPart) ? parseCastlingFen(board, castlingPart) : Result.ok(SquareSet.empty());

      // En passant square
      let epSquare: Square | undefined;
      const epPart = parts.shift();
      if (defined(epPart) && epPart !== '-') {
        epSquare = parseSquare(rules)(epPart);
        if (!defined(epSquare)) return Result.err(new FenError(InvalidFen.EpSquare));
      }

      // Halfmoves or remaining checks
      let halfmovePart = parts.shift();
      let earlyRemainingChecks: Result<RemainingChecks, FenError> | undefined;
      if (defined(halfmovePart) && halfmovePart.includes('+')) {
        earlyRemainingChecks = parseRemainingChecks(halfmovePart);
        halfmovePart = parts.shift();
      }
      const halfmoves = defined(halfmovePart) ? parseSmallUint(halfmovePart) : 0;
      if (!defined(halfmoves)) return Result.err(new FenError(InvalidFen.Halfmoves));

      const fullmovesPart = parts.shift();
      const fullmoves = COMMA_FEN_RULES.includes(rules)
        ? commaFenFullMoves
        : defined(fullmovesPart)
        ? parseSmallUint(fullmovesPart)
        : 1;
      if (!defined(fullmoves)) return Result.err(new FenError(InvalidFen.Fullmoves));

      const remainingChecksPart = parts.shift();
      let remainingChecks: Result<RemainingChecks | undefined, FenError> = Result.ok(undefined);
      if (defined(remainingChecksPart)) {
        if (defined(earlyRemainingChecks)) return Result.err(new FenError(InvalidFen.RemainingChecks));
        remainingChecks = parseRemainingChecks(remainingChecksPart);
      } else if (defined(earlyRemainingChecks)) {
        remainingChecks = earlyRemainingChecks;
      }

      let lastMove: Move | undefined = undefined;
      const lastMovePart = lastMoveParts.shift();
      if (defined(lastMovePart) && lastMovePart.includes('½')) {
        lastMove = parseUci(rules)(lastMovePart.substr(1));
      }

      if (parts.length > 0) return Result.err(new FenError(InvalidFen.Fen));

      return pockets.chain(pockets =>
        unmovedRooks.chain(unmovedRooks =>
          remainingChecks.map(remainingChecks => {
            return {
              board,
              pockets,
              turn,
              unmovedRooks,
              remainingChecks,
              epSquare,
              halfmoves,
              fullmoves: Math.max(1, fullmoves),
              southScore,
              northScore,
              backgammonP1Score,
              backgammonP2Score,
              unusedDice,
              usedDice,
              lastMove,
            };
          })
        )
      );
    });
  };

interface FenOpts {
  promoted?: boolean;
  shredder?: boolean;
  epd?: boolean;
}

export function parsePiece(str: string): Piece | undefined {
  if (!str) return;
  const piece = charToPiece(str[0]);
  if (!piece) return;
  if (str.length === 2 && str[1] === '~') piece.promoted = true;
  else if (str.length > 1) return;
  return piece;
}

export function makePiece(piece: Piece, opts?: FenOpts): string {
  let r = roleToChar(piece.role);
  if (piece.playerIndex === 'p1') r = r.toUpperCase();
  if (opts?.promoted && piece.promoted) r += '~';
  return r;
}

export const makeCFPiece =
  (rules: Rules) =>
  (piece: Piece, endOfRank: boolean): string => {
    const letter = piece.role.charAt(0);
    const roleLetter = MANCALA_FEN_VARIANT.includes(rules)
      ? letter.toUpperCase()
      : piece.playerIndex === 'p1'
      ? letter.toUpperCase()
      : letter;
    const count = piece.role.split('-')[0].substring(1);
    return count + roleLetter + (endOfRank ? '' : ',');
  };

export const makeBoardFen =
  (rules: Rules) =>
  (board: Board, opts?: FenOpts): string => {
    const { ranks, files } = dimensionsForRules(rules);
    let fen = '';
    let empty = 0;
    for (let rank: number = ranks - 1; rank >= 0; rank--) {
      for (let file = 0; file < files; file++) {
        const square = file + rank * files;
        const piece = board.get(square);
        if (!piece) empty++;
        else {
          if (empty > 0) {
            fen += empty;
            fen += COMMA_FEN_RULES.includes(rules) ? ',' : '';
            empty = 0;
          }
          fen += COMMA_FEN_RULES.includes(rules)
            ? makeCFPiece(rules)(piece, file === files - 1)
            : makePiece(piece, opts);
        }

        if (file === files - 1) {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          if (rank !== 0) fen += '/';
        }
      }
    }
    return fen;
  };

export function makePocket(material: MaterialSide): string {
  return ROLES.map(role => roleToChar(role).repeat(material[role])).join('');
}

export function makeCommaFenPocket(material: MaterialSide, playerIndex: PlayerIndex): string {
  return ROLES.map(role => {
    const r = role.split('-')[0];
    const count = r.slice(1);
    const rp = playerIndex === 'p1' ? r.substring(0, 1).toUpperCase() : r.substring(0, 1);
    return (count + rp).repeat(material[role]);
  }).join('');
}

export const makePockets =
  (rules: Rules) =>
  (pocket: Material): string => {
    if (COMMA_FEN_RULES.includes(rules)) {
      console.log(pocket);
      if (makeCommaFenPocket(pocket.p1, 'p1') !== '' && makeCommaFenPocket(pocket.p2, 'p2') !== '') {
        return [makeCommaFenPocket(pocket.p1, 'p1'), makeCommaFenPocket(pocket.p2, 'p2')].join(',');
      } else {
        return makeCommaFenPocket(pocket.p1, 'p1') + makeCommaFenPocket(pocket.p2, 'p2');
      }
    } else return makePocket(pocket.p1).toUpperCase() + makePocket(pocket.p2);
  };

export const makeCastlingFen =
  (rules: Rules) =>
  (board: Board, unmovedRooks: SquareSet, opts?: FenOpts): string => {
    const shredder = opts?.shredder;
    let fen = '';
    for (const playerIndex of PLAYERINDEXES) {
      const backrank = SquareSet.backrank64(playerIndex);
      const king = board.kingOf(playerIndex);
      if (!defined(king) || !backrank.has(king)) continue;
      const candidates = board.pieces(playerIndex, 'r-piece').intersect(backrank);
      for (const rook of unmovedRooks.intersect(candidates).reversed()) {
        if (!shredder && rook === candidates.first() && rook < king) {
          fen += playerIndex === 'p1' ? 'Q' : 'q';
        } else if (!shredder && rook === candidates.last() && king < rook) {
          fen += playerIndex === 'p1' ? 'K' : 'k';
        } else {
          const file = FILE_NAMES[squareFile(rules)(rook)];
          fen += playerIndex === 'p1' ? file.toUpperCase() : file;
        }
      }
    }
    return fen || '-';
  };

export function makeRemainingChecks(checks: RemainingChecks): string {
  return `${checks.p1}+${checks.p2}`;
}
export function mancalaScore(northScore: number | undefined, southScore: number | undefined): string {
  if (!northScore) northScore = 0;
  if (!southScore) southScore = 0;
  return `${southScore} ${northScore}`;
}
export function backgammonScore(p1Score: number | undefined, p2Score: number | undefined): string {
  if (!p2Score) p2Score = 0;
  if (!p1Score) p1Score = 0;
  return `${p1Score} ${p2Score}`;
}
export function backgammonDice(unusedDice: string | undefined, usedDice: string | undefined): string {
  if (!unusedDice) unusedDice = '-';
  if (!usedDice) usedDice = '-';
  return `${unusedDice} ${usedDice}`;
}

const owareMancalaFenParts = (setup: Setup): string[] => [
  mancalaScore(setup.northScore, setup.southScore),
  setup.turn === 'p1' ? 'S' : 'N',
  `${Math.max(1, Math.min(setup.fullmoves, 9999))}`,
];

const backgammonFenParts = (setup: Setup): string[] => [
  backgammonDice(setup.unusedDice, setup.usedDice),
  setup.turn === 'p1' ? 'w' : 'b',
  backgammonScore(setup.backgammonP1Score, setup.backgammonP2Score),
  `${Math.max(1, Math.min(setup.fullmoves, 9999))}`,
];

export const makeLastMove =
  (rules: Rules) =>
  (move: Move): string =>
    `½${makeUci(rules)(move)}`;

const chessVariantFenParts =
  (rules: Rules) =>
  (setup: Setup, opts?: FenOpts): string[] =>
    [
      setup.turn === 'p1' ? 'w' : 'b',
      makeCastlingFen(rules)(setup.board, setup.unmovedRooks, opts),
      defined(setup.epSquare) ? makeSquare(rules)(setup.epSquare) : '-',
      ...(setup.remainingChecks ? [makeRemainingChecks(setup.remainingChecks)] : []),
      ...(opts?.epd
        ? []
        : [`${Math.max(0, Math.min(setup.halfmoves, 9999))}`, `${Math.max(1, Math.min(setup.fullmoves, 9999))}`]),
    ];

export const makeFen =
  (rules: Rules) =>
  (setup: Setup, opts?: FenOpts): string => {
    return [
      makeBoardFen(rules)(setup.board, opts) + (setup.pockets ? `[${makePockets(rules)(setup.pockets)}]` : ''),
      ...(MANCALA_FEN_VARIANT.includes(rules)
        ? owareMancalaFenParts(setup)
        : rules === 'backgammon' || rules === 'nackgammon'
        ? backgammonFenParts(setup)
        : chessVariantFenParts(rules)(setup, opts)),
      ...(rules === 'amazons' && setup.lastMove ? [makeLastMove(rules)(setup.lastMove)] : []),
    ].join(' ');
  };
