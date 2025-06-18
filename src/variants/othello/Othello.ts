import { GameFamily } from './GameFamily';

export class Othello extends GameFamily {
  static override default(): Othello {
    return super.defaultBoard(new this()) as Othello;
  }

  static override getClass() {
    return this;
  }

  static override getInitialBoardFen(): string {
    return '8/8/8/3pP3/3Pp3/8/8/8/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp';
  }

  protected constructor() {
    super('flipello');
  }
}
