import { Result } from '@badrap/result';
import { Move, Piece, Square, PlayerIndex, PLAYERINDEXES, ROLES, FILE_NAMES, Rules } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup, MaterialSide, Material, RemainingChecks, defaultSetup } from './setup';
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
import * as fp from './fp';

const O = fp.Option;
const R = fp.Result;

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
  LastMove = 'ERR_LAST_MOVE',
  RemainingChecks = 'ERR_REMAINING_CHECKS',
  Halfmoves = 'ERR_HALFMOVES',
  Fullmoves = 'ERR_FULLMOVES',
  PlayerScore = 'ERR_PLAYER_SCORE',
  PlayerCaptures = 'ERR_PLAYER_CAPTURES',
  Ko = 'ERR_KO',
  BackgammonScore = 'ERR_BACKGAMMON_SCORE',
}

export class FenError extends Error {}

const fenErr = (err: InvalidFen) => () => new FenError(err);

function nthIndexOf(haystack: string, needle: string, n: number): number {
  let index = haystack.indexOf(needle);
  while (n-- > 0) {
    if (index === -1) break;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return index;
}

function parseSmallUint(str: string): fp.Option<number> {
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

export const parseCastlingFen =
  (board: Board) =>
  (castlingPart: fp.Option<string>): Result<SquareSet, FenError> =>
    fp.pipe(
      castlingPart,
      O.fold(
        castlingPart => {
          let unmovedRooks = SquareSet.empty();
          if (castlingPart === '-') return unmovedRooks;
          if (!/^[KQABCDEFGH]{0,2}[kqabcdefgh]{0,2}$/.test(castlingPart)) {
            return undefined;
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
          return unmovedRooks;
        },
        () => SquareSet.empty()
      ),
      O.toResult(fenErr(InvalidFen.Castling))
    );

export const parseRemainingChecks = (part: string): Result<fp.Option<RemainingChecks>, FenError> => {
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
};

export const parseRemainingChecksOpt = (part: fp.Option<string>): Result<fp.Option<RemainingChecks>, FenError> =>
  fp.pipe(
    part,
    O.fold(parseRemainingChecks, () => Result.ok(undefined))
  );

type BoardAndPocketStrings = {
  board: string;
  pockets?: string;
};
// Extracts the board and pocket portions of the string
const boardAndPocketStrings =
  (rules: Rules) =>
  (boardPart: string): Result<BoardAndPocketStrings, FenError> => {
    const { ranks } = dimensionsForRules(rules);
    if (boardPart.endsWith(']')) {
      const pocketStart = boardPart.indexOf('[');
      if (pocketStart === -1) return Result.err(new FenError(InvalidFen.Fen));
      return Result.ok({
        board: boardPart.substr(0, pocketStart),
        pockets: boardPart.substr(pocketStart + 1, boardPart.length - 1 - pocketStart - 1),
      });
    } else {
      const pocketStart = nthIndexOf(boardPart, '/', ranks - 1);
      if (pocketStart === -1) {
        return Result.ok({ board: boardPart });
      } else {
        return Result.ok({
          board: boardPart.substr(0, pocketStart),
          pockets: boardPart.substr(pocketStart + 1),
        });
      }
    }
  };

type BoardAndOptPockets = {
  board: Board;
  pockets?: Material;
};
const parseBoardAndOptPockets =
  (rules: Rules) =>
  (boardAndPockets: BoardAndPocketStrings): Result<BoardAndOptPockets, FenError> =>
    parseBoardFen(rules)(boardAndPockets.board).chain(board =>
      defined(boardAndPockets.pockets)
        ? parsePockets(rules)(boardAndPockets.pockets).map(pockets => ({ board, pockets }))
        : Result.ok({ board })
    );

type BoardAndPockets = {
  board: Board;
  pockets: Material;
};
const parseBoardAndPockets =
  (rules: Rules) =>
  (boardAndPockets: string): Result<BoardAndPockets, FenError> =>
    fp.pipe(
      boardAndPockets,
      boardAndPocketStrings(rules),
      R.flatMap(({ board, pockets }) =>
        R.zip([
          parseBoardFen(rules)(board),
          fp.pipe(pockets, O.flatMapErr(parsePockets(rules), fenErr(InvalidFen.Pockets))),
        ])
      ),
      R.map(([board, pockets]) => ({ board, pockets }))
    );

const parsePlayerTurn =
  (p1Char: string = 'w', p2Char: string = 'b') =>
  (turnPart: fp.Option<string>): Result<PlayerIndex, FenError> =>
    fp.pipe(
      turnPart,
      O.fold(
        (turnPart: string) =>
          turnPart.toLowerCase() === p1Char.toLowerCase()
            ? Result.ok('p1')
            : turnPart.toLowerCase() === p2Char.toLowerCase()
            ? Result.ok('p2')
            : Result.err(fenErr(InvalidFen.Turn)()),
        () => Result.ok('p1')
      )
    );

const parseMoves =
  (min: number, def: number) =>
  (err: () => Error) =>
  (part: fp.Option<string>): Result<number, FenError> =>
    fp.pipe(
      part,
      O.fold(
        part =>
          fp.pipe(
            part,
            O.flatMap(parseSmallUint),
            O.map(fullmoves => Math.max(min, fullmoves)),
            O.toResult(err)
          ),
        () => Result.ok(def)
      )
    );

const parseHalfMoves = (part: fp.Option<string>): Result<number, FenError> =>
  parseMoves(0, 0)(fenErr(InvalidFen.Halfmoves))(part);

const parseFullMoves = (part: fp.Option<string>): Result<number, FenError> =>
  parseMoves(1, 1)(fenErr(InvalidFen.Fullmoves))(part);

const parseFenUint =
  (err: () => Error) =>
  (part: fp.Option<string>): Result<number, FenError> =>
    fp.pipe(part, O.flatMap(parseSmallUint), O.toResult(err));

const parseScore = parseFenUint(fenErr(InvalidFen.PlayerScore));
const parseCaptures = parseFenUint(fenErr(InvalidFen.PlayerCaptures));

const parseFenSquare =
  (rules: Rules) =>
  (part: fp.Option<string>): Result<fp.Option<Square>, FenError> =>
    fp.pipe(
      part,
      O.filter(part => part !== '-'),
      O.fold(
        part => fp.pipe(part, parseSquare(rules), O.toResultOption(fenErr(InvalidFen.EpSquare))),
        () => Result.ok(undefined)
      )
    );

const parseLastMove =
  (rules: Rules) =>
  (part: fp.Option<string>): Result<fp.Option<Move>, FenError> =>
    fp.pipe(
      part,
      O.filter(part => part.includes('½')),
      O.map(part => part.substr(1)),
      O.fold(
        part => fp.pipe(part, parseUci(rules), O.toResultOption(fenErr(InvalidFen.LastMove))),
        () => Result.ok(undefined)
      )
    );

//------------------------------------------------------------------------------
// Mancala FEN parsing
const mancalaPlayerTurn = parsePlayerTurn('s', 'n');

const parseMancalaFen =
  (rules: Rules) =>
  (fen: string): Result<Setup, FenError> => {
    const [boardPart, ...parts] = fen.split(' ');

    if (parts.length != 4) {
      return Result.err(new FenError(InvalidFen.Fen));
    }

    return fp
      .resultZip([
        parseBoardFen(rules)(boardPart),
        parseScore(parts[0]),
        parseScore(parts[1]),
        mancalaPlayerTurn(parts[2]),
        parseFullMoves(parts[3]),
      ])
      .map(([board, southScore, northScore, turn, fullmoves]) => ({
        ...defaultSetup(),
        board,
        turn,
        fullmoves,
        southScore,
        northScore,
      }));
  };

//------------------------------------------------------------------------------
// Go FEN parsing
const parseKo = (part: fp.Option<string>): Result<fp.Option<number>> => {
  return fp.pipe(
    part,
    O.toResult(fenErr(InvalidFen.Ko)),
    R.flatMap(part => {
      if (part === '-') return Result.ok(undefined);
      return parseScore(part);
    })
  );
};

const parseGoFen =
  (rules: Rules) =>
  (fen: string): Result<Setup, FenError> => {
    const [boardAndPockets, ...parts] = fen.split(' ');

    if (parts.length != 8) {
      return Result.err(new FenError(InvalidFen.Fen));
    }

    return fp
      .resultZip([
        parseBoardAndPockets(rules)(boardAndPockets),
        parsePlayerTurn()(parts[0]),
        parseKo(parts[1]),
        parseScore(parts[2]),
        parseScore(parts[3]),
        parseCaptures(parts[4]),
        parseCaptures(parts[5]),
        parseScore(parts[6]),
        parseFullMoves(parts[7]),
      ])
      .map(([{ board, pockets }, turn, ko, p1Score, p2Score, p1Captures, p2Captures, komi, fullmoves]) => ({
        ...defaultSetup(),
        board,
        pockets,
        turn,
        p1Score,
        p2Score,
        p1Captures,
        p2Captures,
        ko,
        komi,
        fullmoves,
      }));
  };

export const makeGoFen =
  (rules: Rules) =>
  (setup: Setup, opts?: FenOpts): string => {
    return [
      makeBoardFen(rules)(setup.board, opts) + (setup.pockets ? `[${makePockets(rules)(setup.pockets)}]` : ''),
      playerTurn(setup),
      fp.pipe(
        setup.ko,
        O.map(n => `${n}`),
        O.unwrapOr('-')
      ),
      int(setup.p1Score),
      int(setup.p2Score),
      int(setup.p1Captures),
      int(setup.p2Captures),
      int(setup.komi),
      int(setup.fullmoves),
    ].join(' ');
  };

//------------------------------------------------------------------------------
// Backgammon fens
export const parseBackgammonFen =
  (rules: Rules) =>
  (fen: string): Result<Setup, FenError> => {
    const [boardAndPockets, ...parts] = fen.split(' ');

    if (parts.length != 6) {
      return Result.err(new FenError(InvalidFen.Fen));
    }

    return fp
      .resultZip([
        parseBoardAndPockets(rules)(boardAndPockets),
        Result.ok(parts[0]),
        Result.ok(parts[1]),
        parsePlayerTurn()(parts[2]),
        parseScore(parts[3]),
        parseScore(parts[4]),
        parseFullMoves(parts[5]),
      ])
      .map(([{ board, pockets }, unusedDice, usedDice, turn, p1Score, p2Score, fullmoves]) => ({
        ...defaultSetup(),
        board,
        pockets,
        turn,
        p1Score,
        p2Score,
        fullmoves,
        unusedDice,
        usedDice,
      }));
  };

//------------------------------------------------------------------------------
// Regular fen parsing
export const parseFen =
  (rules: Rules) =>
  (fen: string): Result<Setup, FenError> => {
    const [boardPart, ...originalParts] = fen.split(' ');
    const lastMoveParts = originalParts.filter(f => f.includes('½'));
    const parts = originalParts.filter(f => !f.includes('½'));

    if (rules === 'oware' || rules === 'togyzkumalak') {
      return parseMancalaFen(rules)(fen);
    }
    if (rules === 'go9x9' || rules === 'go13x13' || rules === 'go19x19') {
      return parseGoFen(rules)(fen);
    }
    if (rules === 'backgammon' || rules === 'nackgammon') {
      return parseBackgammonFen(rules)(fen);
    }

    if (parts.length > 6) {
      return Result.err(new FenError(InvalidFen.Fen));
    }

    const hasEarlyRemainingChecks = parts.length > 3 ? parts[3].includes('+') : false;

    // Board and pockets
    return boardAndPocketStrings(rules)(boardPart)
      .chain(parseBoardAndOptPockets(rules))
      .chain(({ board, pockets }) => {
        return fp
          .resultZip([
            fp.pipe(parts[0], parsePlayerTurn()),
            parseCastlingFen(board)(parts[1]),
            parseFenSquare(rules)(parts[2]),
            parseRemainingChecksOpt(hasEarlyRemainingChecks ? parts[3] : parts[5]),
            parseHalfMoves(hasEarlyRemainingChecks ? parts[4] : parts[3]),
            parseFullMoves(hasEarlyRemainingChecks ? parts[5] : parts[4]),
            parseLastMove(rules)(lastMoveParts[0]),
          ])
          .map(([turn, unmovedRooks, epSquare, remainingChecks, halfmoves, fullmoves, lastMove]) => ({
            board,
            pockets,
            turn,
            unmovedRooks,
            remainingChecks,
            epSquare,
            halfmoves,
            fullmoves: Math.max(1, fullmoves),
            lastMove,
          }));
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

const int = (i: fp.Option<number>): string => `${fp.Option.unwrapOr(0)(i)}`;

export function playerScores(p1Score: fp.Option<number>, p2Score: fp.Option<number>): string {
  const withDefault = fp.Option.unwrapOr(0);
  return `${withDefault(p1Score)} ${withDefault(p2Score)}`;
}
export function backgammonDice(unusedDice: fp.Option<string>, usedDice: fp.Option<string>): string {
  const withDefault = fp.Option.unwrapOr('-');
  return `${withDefault(unusedDice)} ${withDefault(usedDice)}`;
}

const owareMancalaFenParts = (setup: Setup): string[] => [
  mancalaScore(setup.northScore, setup.southScore),
  setup.turn === 'p1' ? 'S' : 'N',
  `${Math.max(1, Math.min(setup.fullmoves, 9999))}`,
];

const backgammonFenParts = (setup: Setup): string[] => [
  backgammonDice(setup.unusedDice, setup.usedDice),
  setup.turn === 'p1' ? 'w' : 'b',
  playerScores(setup.p1Score, setup.p2Score),
  `${Math.max(1, Math.min(setup.fullmoves, 9999))}`,
];

const playerTurn = (setup: Setup): string => (setup.turn === 'p1' ? 'w' : 'b');

export const makeLastMove =
  (rules: Rules) =>
  (move: Move): string =>
    `½${makeUci(rules)(move)}`;

const chessVariantFenParts =
  (rules: Rules) =>
  (setup: Setup, opts?: FenOpts): string[] =>
    [
      playerTurn(setup),
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
    if (rules === 'go9x9' || rules === 'go13x13' || rules === 'go19x19') {
      return makeGoFen(rules)(setup, opts);
    }
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
