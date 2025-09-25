import { type BoardDimensions, type Rules } from '../../types';
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
