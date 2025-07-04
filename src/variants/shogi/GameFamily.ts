import { Result } from '@badrap/result';
import { Board } from '../../board';
import { Castles, type PositionError } from '../../chess';
import type { Setup } from '../../setup';
import { isDrop, type Move, type PlayerIndex, Role, SquareName } from '../../types';
import { opposite } from '../../util';
import { ExtendedMoveInfo, GameFamilyKey, Key, LexicalUci, NotationStyle, ParsedMove, VariantKey } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override family: GameFamilyKey = GameFamilyKey.shogi;
  static override playersColors: Record<PlayerIndex, string> = {
    p1: 'black',
    p2: 'white',
  };

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    const parsed = this.parseUciToUsi(move.uci, this.width, this.height),
      board = this.readFen(move.fen, this.height, this.width),
      prevBoard = this.readFen(move.prevFen, this.height, this.width),
      prevrole = prevBoard.pieces[parsed.orig],
      dest = parsed.dest,
      connector = this.isCapture(prevBoard, board) ? 'x' : this.isDrop(prevBoard, board) ? '*' : '-',
      role = board.pieces[dest],
      piece = role[0] === '+' ? role[0] + role[1].toUpperCase() : role[0].toUpperCase(),
      origin = !this.isDrop(prevBoard, board) && this.isMoveAmbiguous(board, parsed.dest, prevrole) ? parsed.orig : '',
      promotion = this.promotionSymbol(prevBoard, board, parsed);

    if (promotion == '+') return `${piece.slice(1)}${origin}${connector}${dest}${promotion}`;

    return `${piece}${origin}${connector}${dest}${promotion}`;
  }

  // @TODO: manage pockets
  static override defaultBoard(pos: Variant) {
    pos.board = Board.default();
    pos.turn = 'p1';
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.usi;
  }

  static override getVariantKeys(): VariantKey[] {
    return [
      VariantKey.minishogi,
      VariantKey.shogi,
    ];
  }

  static override parseLexicalUci(uci: string): LexicalUci | undefined {
    if (!uci) return undefined;
    const pos = uci.match(/[a-z][1-9][0-9]?/g) as Key[];

    if (uci[1] === '@') {
      return {
        from: pos[0],
        to: pos[0],
        dropRole: `${uci[0].toLowerCase()}-piece` as Role,
      };
    }

    let promotion: Role | undefined = undefined;

    const uciToFrom = `${pos[0]}${pos[1]}`;
    if (uci.startsWith(uciToFrom) && uci.length == uciToFrom.length + 1) {
      promotion = `p${uci[uci.length - 1]}-piece` as Role;
    }

    return {
      from: pos[0],
      to: pos[1],
      promotion,
    };
  }

  static override patchFairyUci(move: string, fen: string) {
    if (move.length !== 5) {
      return move;
    }
    return `${move.slice(0, 4)}${this.getRoleFromFenAt(fen, move.slice(0, 2) as SquareName)}`;
  }

  static fromSetupAndPos(setup: Setup, pos: GameFamily): Result<GameFamily, PositionError> {
    pos.board = setup.board.clone();
    pos.pockets = setup.pockets?.clone();
    pos.turn = setup.turn;
    pos.castles = Castles.empty();
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = setup.halfmoves;
    pos.fullmoves = setup.fullmoves;
    return pos.validate().map(_ => pos);
  }

  static getRoleFromFenAt(fen: string, coordinates: SquareName): Role {
    const column = this.width - (coordinates[0].charCodeAt(0) - 97);
    const row = this.height + 1 - Number(coordinates[1]);
    const board = this.readFen(fen, this.height, this.width);
    const role = board.pieces[column + '' + row];
    return role.toLowerCase() as Role;
  }

  static isCapture(prevBoard: Board, board: Board): boolean {
    return Object.keys(prevBoard.pieces).length - Object.keys(board.pieces).length == 1;
  }

  static isDrop(prevBoard: Board, board: Board): boolean {
    return Object.keys(prevBoard.pieces).length - Object.keys(board.pieces).length == -1;
  }

  static isMoveAmbiguous(board: any, dest: string, prevRole: string): boolean {
    const locations: string[] = this.previousLocationsOfPiece(prevRole, dest);
    const possibleRoles = locations.map(l => board.pieces[l]).filter(x => x != undefined);
    return possibleRoles.includes(prevRole);
  }

  static previousLocationsOfPiece(role: string, dest: string): string[] {
    // illegal positions will just return nothing from board.piece[l] therefore dont check
    // doesn't account for pins or obstruction
    // dest is file + rank ,each single digit 1-9.
    const sb: string[] = [];
    switch (role) {
      case 'N':
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) + 2).toString());
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) + 2).toString());
        break; // n-piece (p1)

      case 'n':
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) - 2).toString());
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) - 2).toString());
        break; // n-piece (p2)

      case 'S':
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) + 1).toString());
        sb.push((parseInt(dest[0]) + 0).toString() + (parseInt(dest[1]) + 1).toString());
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) + 1).toString());
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) - 1).toString());
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) - 1).toString());
        break; // s-piece (p1)

      case 's':
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) - 1).toString());
        sb.push((parseInt(dest[0]) + 0).toString() + (parseInt(dest[1]) - 1).toString());
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) - 1).toString());
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) + 1).toString());
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) + 1).toString());
        break; // s-piece (p2)

      case 'b':
      case 'B':
        [1, 2, 3, 4, 5, 6, 7, 8].forEach(i => {
          sb.push((parseInt(dest[0]) + i).toString() + (parseInt(dest[1]) + i).toString());
          sb.push((parseInt(dest[0]) + i).toString() + (parseInt(dest[1]) - i).toString());
          sb.push((parseInt(dest[0]) - i).toString() + (parseInt(dest[1]) + i).toString());
          sb.push((parseInt(dest[0]) - i).toString() + (parseInt(dest[1]) - i).toString());
        });
        break; // b-piece

      case 'r':
      case 'R':
        [1, 2, 3, 4, 5, 6, 7, 8].forEach(i => {
          sb.push((parseInt(dest[0]) + i).toString() + (parseInt(dest[1]) + 0).toString());
          sb.push((parseInt(dest[0]) - i).toString() + (parseInt(dest[1]) + 0).toString());
          sb.push((parseInt(dest[0]) + 0).toString() + (parseInt(dest[1]) + i).toString());
          sb.push((parseInt(dest[0]) + 0).toString() + (parseInt(dest[1]) - i).toString());
        });
        break; // r-piece

      case '+P':
      case '+L':
      case '+N':
      case '+S':
      case 'G':
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) + 1).toString());
        sb.push((parseInt(dest[0]) + 0).toString() + (parseInt(dest[1]) + 1).toString());
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) + 1).toString());
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) + 0).toString());
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) + 0).toString());
        sb.push((parseInt(dest[0]) + 0).toString() + (parseInt(dest[1]) - 1).toString());
        break; // g-piece (p1)

      case '+s':
      case '+n':
      case '+l':
      case '+p':
      case 'g':
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) - 1).toString());
        sb.push((parseInt(dest[0]) + 0).toString() + (parseInt(dest[1]) - 1).toString());
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) - 1).toString());
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) + 0).toString());
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) + 0).toString());
        sb.push((parseInt(dest[0]) + 0).toString() + (parseInt(dest[1]) + 1).toString());
        break; // g-piece (p2)

      case '+b':
      case '+B':
        [1, 2, 3, 4, 5, 6, 7, 8].forEach(i => {
          sb.push((parseInt(dest[0]) + i).toString() + (parseInt(dest[1]) + i).toString());
          sb.push((parseInt(dest[0]) + i).toString() + (parseInt(dest[1]) - i).toString());
          sb.push((parseInt(dest[0]) - i).toString() + (parseInt(dest[1]) + i).toString());
          sb.push((parseInt(dest[0]) - i).toString() + (parseInt(dest[1]) - i).toString());
        });
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) + 0).toString());
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) + 0).toString());
        sb.push((parseInt(dest[0]) + 0).toString() + (parseInt(dest[1]) + 1).toString());
        sb.push((parseInt(dest[0]) + 0).toString() + (parseInt(dest[1]) - 1).toString());
        break; // pb-piece

      case '+r':
      case '+R':
        [1, 2, 3, 4, 5, 6, 7, 8].forEach(i => {
          sb.push((parseInt(dest[0]) + i).toString() + (parseInt(dest[1]) + 0).toString());
          sb.push((parseInt(dest[0]) - i).toString() + (parseInt(dest[1]) + 0).toString());
          sb.push((parseInt(dest[0]) + 0).toString() + (parseInt(dest[1]) + i).toString());
          sb.push((parseInt(dest[0]) + 0).toString() + (parseInt(dest[1]) - i).toString());
        });
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) + 1).toString());
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) + 1).toString());
        sb.push((parseInt(dest[0]) + 1).toString() + (parseInt(dest[1]) - 1).toString());
        sb.push((parseInt(dest[0]) - 1).toString() + (parseInt(dest[1]) - 1).toString());
        break; // pr-piece

      default:
        // nothing k-piece, p-piece, l-piece
    }
    return sb;
  }

  static promotionSymbol(prevBoard: any, board: any, parsed: ParsedMove): string {
    // '+' for promoted, '=' for chose not to promote, '' for normal move
    if (this.isDrop(prevBoard, board)) return '';

    const prevRole = prevBoard.pieces[parsed.orig];
    const currentRole = board.pieces[parsed.dest];

    if (!prevRole) return '';
    if (prevRole !== currentRole) return '+';
    if (prevRole.includes('+')) return '';
    if (
      currentRole.toLowerCase() !== 'g'
      && currentRole.toLowerCase() !== 'k'
      && ((board.wMoved && ['1', '2', '3'].includes(parsed.dest.slice(1)))
        || (!board.wMoved && ['7', '8', '9'].includes(parsed.dest.slice(1))))
    ) {
      return '=';
    } else {
      return '';
    }
  }

  static roleToPiece(role: string) {
    switch (role) {
      case 'n':
      case 'N':
        return 'H';
      case 'b':
      case 'B':
        return 'E';
      default:
        return role.toUpperCase();
    }
  }

  static numFriendlyPawnsInColumn(
    origFile: string,
    board: any,
    numRanks: number,
    role: string,
    addMovedPiece: boolean,
    origPieceRank: number,
    newPieceRank: number,
  ): number[] {
    const pawnRanks: number[] = [];
    const ranks = [...Array(numRanks + 1).keys()].slice(1);
    ranks.forEach(r => {
      if (addMovedPiece && r === origPieceRank) pawnRanks.push(origPieceRank); // add the moved piece in this position to avoid sorting
      const piece = board.pieces[origFile + r.toString()];
      if (piece === role) {
        if (!addMovedPiece && r === newPieceRank) {
          pawnRanks.push(origPieceRank); // add moved pawn in original position in order to acquire its index from prev position
        } else {
          pawnRanks.push(r);
        }
      }
    });
    return pawnRanks;
  }

  override clone(): GameFamily {
    return super.clone() as GameFamily;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }

  override play(move: Move): void {
    const turn = this.turn;

    this.halfmoves += 1;
    if (turn === 'p2') this.fullmoves += 1;
    this.turn = opposite(turn);

    if (isDrop(move)) {
      this.board.set(move.to, { role: move.role, playerIndex: turn });
      if (this.pockets) this.pockets[turn][move.role]--;
      if (move.role === 'p-piece') this.halfmoves = 0;
    } else {
      const piece = this.board.take(move.from);
      if (!piece) return;

      if (move.promotion) {
        piece.role = move.promotion;
        piece.promoted = true;
      }

      const capture = this.board.set(move.to, piece);
      if (capture) this.playCaptureAt(move.to, capture);
    }
  }
}
