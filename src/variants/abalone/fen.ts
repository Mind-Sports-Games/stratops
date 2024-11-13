import { Result } from "@badrap/result";

import { Rules } from "../../types";
import { FenError, InvalidFen, charToPiece } from "../../fen";
import { Board } from "../../board";
import { dimensionsForRules } from "../../util";


/*
9 -              &  \' (  )  *
8 -           7  8  9  !  ?  ¥
7 -        Y  Z  0  1  2  3  £
6 -     P  Q  R  S  T  U  V  ¡
5 -  G  H  I  J  K  L  M  N  }
4 -  y  z  A  B  C  D  E  F
3 -  q  r  s  t  u  v  w
2 -  i  j  k  l  m  n
1 -  a  b  c  d  e
     |  |  |  |  |  |  |  |  |
     A  B  C  D  E  F  G  H  I

9 -              s  s  *  S  S
8 -           s  s  s  S  S  S
7 -        *  s  s  *  S  S  *
6 -     *  *  *  *  *  *  *  *
5 -  *  *  *  *  *  *  *  *  *
4 -  *  *  *  *  *  *  *  *
3 -  *  S  S  *  s  s  *
2 -  S  S  S  s  s  s
1 -  S  S  *  s  s
     |  |  |  |  |  |  |  |  |
     A  B  C  D  E  F  G  H  I
*/
export const parseBoardFen = (rules: Rules) => (boardPart: string): Result<Board, FenError> => {
    const board = Board.empty(rules);
    const { ranks, files } = dimensionsForRules(rules);
    let rank = ranks - 1;
    let file = 0;
    for (let i = 0; i < boardPart.length; i++) {
        const c = boardPart[i];
        if (c === '/') {
            rank--;
            file = 0;
        } else {
            const step = parseInt(c, 10);
            if (step > 0) {
                file += step;
            } else {
                if (file > files || rank < 0) return Result.err(new FenError(InvalidFen.Board));
                const square = file + rank * files;
                const piece = charToPiece(c);
                if (!piece) { console.log("char:" + c); return Result.err(new FenError(InvalidFen.Board)); }
                board.set(square, piece);
                file++;
            }
        }
    }
    if (rank !== 0 /*|| file !== files*/) return Result.err(new FenError(InvalidFen.Board));
    return Result.ok(board);
}