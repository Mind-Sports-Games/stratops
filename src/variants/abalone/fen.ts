import { Result } from '@badrap/result';

import { Board } from '../../board';
import { charToPiece, FenError, InvalidFen } from '../../fen';
import { type Rules } from '../../types';
import { getBoardSize, getCellList, type Pos } from './util';

// @TODO: refactor this so it is included in the GameFamily
export const parseBoardFen = (rules: Rules) => (boardFen: string): Result<Board, FenError> => {
  const board = Board.empty(rules);

  const cells: Pos[] = getCellList(rules);
  const width = getBoardSize(rules).files;

  let k = 0;
  for (let i = 0; i < boardFen.length; i++) {
    const c = boardFen[i];

    if (c === ' ') break;
    else if (c !== '/') {
      const steps = parseInt(c);

      if (steps > 0) k += steps;
      else {
        const piece = charToPiece(c);
        if (!piece) return Result.err(new FenError(InvalidFen.Board));

        board.set(cells[k][0] + cells[k][1] * width, piece);

        k++;
      }
    }
  }

  return Result.ok(board);
};
