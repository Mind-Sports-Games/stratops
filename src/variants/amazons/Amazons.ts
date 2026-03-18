import type { Result } from '@badrap/result';
import { Castles, type PositionError } from '../../chess';
import { Material, type Setup } from '../../setup';
import type { BoardDimensions, NormalMove, Rules } from '../../types';
import { defined } from '../../util';
import { GameFamily } from './GameFamily';

export class Amazons extends GameFamily {
  static override height: BoardDimensions['ranks'] = 10;
  static override width: BoardDimensions['files'] = 10;
  static override rules: Rules = 'amazons';

  static override default(): Amazons {
    const pos = super.default();
    return pos as Amazons;
  }

  static override fromSetup(setup: Setup): Result<Amazons, PositionError> {
    const pos = new this();
    pos.board = setup.board.clone();
    if (setup.pockets) {
      pos.pockets = new Material(setup.pockets.p1, setup.pockets.p2);
    }
    pos.turn = setup.turn;
    pos.castles = Castles.empty();
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = setup.halfmoves;
    pos.fullmoves = setup.fullmoves;
    pos.lastMove = setup.lastMove;
    if (defined(pos.lastMove)) {
      const move = pos.lastMove as NormalMove;
      pos.play(move);
      pos.halfmoves -= 1;
      pos.fullmoves -= 1;
      if (pos.turn === 'p1') pos.turn = 'p2';
      else pos.turn = 'p1';
    }
    return pos.validate().map(_ => pos) as Result<Amazons, PositionError>;
  }

  static override getEmptyBoardFen(): string {
    return '10/10/10/10/10/10/10/10/10/10';
  }

  static override getInitialBoardFen(): string {
    return '3q2q3/10/10/q8q/10/10/Q8Q/10/10/3Q2Q3/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpppppppppppppppppppppppppppppppppppppppppppppp';
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('amazons');
  }
}
