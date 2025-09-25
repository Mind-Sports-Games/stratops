import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class AntiOthello extends GameFamily {
  static override rules: Rules = 'antiflipello';

  static override default(): AntiOthello {
    return super.defaultBoard(new this()) as AntiOthello;
  }

  static override getClass() {
    return this;
  }

  static override getInitialBoardFen(): string {
    return '8/8/8/3pP3/3Pp3/8/8/8/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp';
  }

  protected constructor() {
    super('antiflipello');
  }
}
