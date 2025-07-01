import { Result } from '@badrap/result';
import { PositionError } from '../../chess';
import { type BoardDimensions, type Piece, PLAYERINDEXES, type Rules, type Square } from '../../types';
import { GameFamily } from './GameFamily';

export class GrandOthello extends GameFamily {
  static override height: BoardDimensions['ranks'] = 10;
  static override width: BoardDimensions['files'] = 10;
  static override rules: Rules = 'flipello10';

  static override default(): GrandOthello {
    return super.defaultBoard(new this()) as GrandOthello;
  }

  static override getClass() {
    return this;
  }

  static override getEmptyBoardFen(): string {
    return '10/10/10/10/10/10/10/10/10/10';
  }

  static override getInitialBoardFen(): string {
    return '10/10/10/10/4pP4/4Pp4/10/10/10/10/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp';
  }

  override readonly initialPieces: Record<Square, Piece> = {
    44: {
      role: `p-piece`,
      playerIndex: PLAYERINDEXES[0],
    } as Piece,
    45: {
      role: `p-piece`,
      playerIndex: PLAYERINDEXES[1],
    } as Piece,
    54: {
      role: `p-piece`,
      playerIndex: PLAYERINDEXES[1],
    } as Piece,
    55: {
      role: `p-piece`,
      playerIndex: PLAYERINDEXES[0],
    } as Piece,
  };

  protected constructor() {
    super('flipello10');
  }
}
