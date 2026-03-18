import { Rules } from '../../types';
import { type ExtendedMoveInfo } from '../types';
import { GameFamily } from './GameFamily';

export class AntiOthello extends GameFamily {
  static override rules: Rules = 'antiflipello';

  static override default(): AntiOthello {
    return super.defaultBoard(new this()) as AntiOthello;
  }

  static override getClass() {
    return this;
  }

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    if (!move.uci.includes('@')) return 'PASS';

    const reg = move.uci.match(/[a-zA-Z][1-9@]0?/g) as string[];
    const dest = reg[1];

    // convert into flipello notation - a1 is top left for first player (not bottom left)
    const newRank = 9 - parseInt(dest.slice(1));
    const destPos = dest[0] + newRank;

    return `${destPos}`;
  }

  static override getInitialBoardFen(): string {
    return '8/8/8/3pP3/3Pp3/8/8/8/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp';
  }

  protected constructor() {
    super('antiflipello');
  }
}
