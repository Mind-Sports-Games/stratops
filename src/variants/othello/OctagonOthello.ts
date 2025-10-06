import { type BoardDimensions, type Rules } from '../../types';
import { type ExtendedMoveInfo } from '../types';
import { GameFamily } from './GameFamily';

export class OctagonOthello extends GameFamily {
  static override height: BoardDimensions['ranks'] = 10;
  static override width: BoardDimensions['files'] = 10;
  static override rules: Rules = 'octagonflipello';

  static override default(): OctagonOthello {
    return super.defaultBoard(new this()) as OctagonOthello;
  }

  static override getClass() {
    return this;
  }

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    if (!move.uci.includes('@')) return 'PASS';

    const reg = move.uci.match(/[a-zA-Z][1-9@]0?/g) as string[];
    const dest = reg[1];

    // convert into flipello notation - a1 is top left for first player (not bottom left)
    const newRank = 11 - parseInt(dest.slice(1));
    const destPos = dest[0] + newRank;

    return `${destPos}`;
  }

  static override getEmptyBoardFen(): string {
    return '10/10/10/10/10/10/10/10/10/10';
  }

  static override getInitialBoardFen(): string {
    return '10/10/10/10/4pP4/4Pp4/10/10/10/10/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp';
  }

  protected constructor() {
    super('octagonflipello');
  }
}
