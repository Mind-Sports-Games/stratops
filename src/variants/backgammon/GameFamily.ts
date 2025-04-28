import type { Result } from '@badrap/result';
import type { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { BoardDimensions, PlayerIndex } from '../../types';
import { ExtendedMoveInfo, NotationStyle } from '../types';
import { Variant } from '../Variant';

export abstract class GameFamily extends Variant {
  static override height: BoardDimensions['ranks'] = 2;
  static override width: BoardDimensions['files'] = 12;

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    let isLift = false; // using this instead of changing the regex
    if (move.uci === 'roll') return '';
    if (move.uci === 'cubeo') return 'Double';
    if (move.uci === 'cubey') return 'Take';
    if (move.uci === 'cuben') return 'Drop';
    if (move.uci === 'undo') return 'undo';
    if (move.uci === 'endturn') return '(no-play)';
    if (move.uci.includes('/')) return `${move.uci.replace('/', '')}:`;
    if (move.uci.includes('^')) {
      isLift = true;
    }

    const reg = isLift
      ? (move.uci.replace('^', 'a1').match(/[a-lsA-LS][1-2@]/g) as string[])
      : (move.uci.replace('x', '').match(/[a-lsA-LS][1-2@]/g) as string[]);
    const orig = reg[0];
    const dest = reg[1];
    const isDrop = reg[0].includes('@');
    const movePlayer = move.prevFen.split(' ')[3] === 'w' ? 'p1' : 'p2';
    const moveOpponent = move.prevFen.split(' ')[3] === 'w' ? 'p2' : 'p1';

    const diceRoll = this.getDice(move.prevFen); // this is not really used but for completeness

    // captures
    const capturedPiecesBefore = this.numberofCapturedPiecesOfPlayer(moveOpponent, move.prevFen);
    const capturedPiecesAfter = this.numberofCapturedPiecesOfPlayer(moveOpponent, move.fen);
    const isCapture = capturedPiecesBefore !== capturedPiecesAfter;
    const isCaptureNotation = isCapture ? '*' : '';

    // board pos
    const origFile = 1 + Math.abs(orig.charCodeAt(0) - 'a'.charCodeAt(0));
    const origRank = parseInt(orig.slice(1), 10);
    const destFile = 1 + Math.abs(dest.charCodeAt(0) - 'a'.charCodeAt(0));
    const destRank = parseInt(dest.slice(1), 10);

    const origBoardPosNumber = isDrop
      ? 'bar'
      : movePlayer === 'p1'
      ? origRank === 1
        ? this.width + 1 - origFile
        : this.width + origFile
      : origRank === 1
      ? this.width + origFile
      : this.width + 1 - origFile;
    const destBoardPosNumber = movePlayer === 'p1'
      ? destRank === 1
        ? this.width + 1 - destFile
        : this.width + destFile
      : destRank === 1
      ? this.width + destFile
      : this.width + 1 - destFile;

    // examples:
    // 43: 8/4 8/5
    // 55: 21/16(3) bar/5
    // 21: 8/7* 13/11
    if (isLift) return `${diceRoll}: ${destBoardPosNumber}/off`;
    return `${diceRoll}: ${origBoardPosNumber}/${destBoardPosNumber}${isCaptureNotation}`;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetup(setup) as Result<GameFamily, PositionError>;
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.bkg;
  }

  static override getScoreFromFen(fen: string, playerIndex: string): number | undefined {
    return +fen.split(' ')[playerIndex === 'p1' ? 4 : 5];
  }

  static combinedNotation(actionNotations: string[]): string {
    const actions: string[] = [];
    const captures: boolean[] = [];
    const occurances: number[] = [];
    for (const notation of actionNotations) {
      if (notation.split(' ').length === 2) {
        const movePart = notation.split(' ')[1].replace('*', '');
        const isCapture = notation.split(' ')[1].includes('*');
        if (actions.includes(movePart)) {
          const duplicateIndex = actions.indexOf(movePart);
          occurances[duplicateIndex] += 1;
          captures[duplicateIndex] = captures[duplicateIndex] || isCapture;
        } else {
          actions.push(movePart);
          occurances.push(1);
          if (isCapture) {
            captures.push(true);
          } else {
            captures.push(false);
          }
        }
      } else if (notation === '(no-play)' && actionNotations.length === 2) {
        return actionNotations[0].split(' ')[0] + ' ' + notation;
      } else if (notation === '(no-play)' && actionNotations.length === 1) {
        return '...';
      } else if (['Double', 'Take', 'Drop'].includes(notation) && actionNotations.length === 1) {
        return notation;
      }
    }

    // dice roll is always first action - check this assumption in multipoint games
    const dice = actionNotations[0].split(' ')[0];
    let output = dice;

    actions.forEach((action, index) => {
      const occurancesString = occurances[index] > 1 ? `(${occurances[index]})` : '';
      const captureString = captures[index] ? '*' : '';
      const part = ` ${action}${occurancesString}${captureString}`;
      output += part;
    });

    // examples (also see tests):
    // ["43: 8/4", "43: 8/4"] -> "43: 8/4(2)"
    return output;
  }

  static getDice(fen: string): string {
    if (fen.split(' ').length < 2) return '';
    const unusedDice = fen.split(' ')[1].replace('-', '').split('/');
    const usedDice = fen.split(' ')[2].replace('-', '').split('/');
    const dice = unusedDice.concat(usedDice).join('');
    if (dice.length === 4) return dice.slice(2); // handles doubles
    return dice;
  }

  static numberofCapturedPiecesOfPlayer(player: 'p1' | 'p2', fen: string): number {
    const pieceString = player === 'p1' ? 'S' : 's';

    if (fen.indexOf('[') !== -1 && fen.indexOf(']') !== -1) {
      const start = fen.indexOf('[', 0);
      const end = fen.indexOf(']', start);
      const pocket = fen.substring(start + 1, end);
      if (pocket === '') return 0;
      for (const p of pocket.split(',')) {
        const count = p.slice(0, -1);
        const letter = p.substring(p.length - 1);
        if (letter === pieceString) {
          return +count;
        }
      }

      return 0;
    } else return 0;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
