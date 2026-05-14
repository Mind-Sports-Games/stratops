import { type Result } from '@badrap/result';
import { type PositionError } from '../../chess';
import { registerAbaloneFenParser, registerAbaloneFenWriter } from '../../fen';
import type { Setup } from '../../setup';
import { type BoardDimensions, type Rules } from '../../types';
import { defined } from '../../util.js';
import { GameFamily } from './GameFamily';

export class Abalone extends GameFamily {
  static override rules: Rules = 'abalone';
  static override width: BoardDimensions['files'] = 9;
  static override height: BoardDimensions['ranks'] = 9;
  static override startingPieceCount = 14;
  static override winningScore = 6;

  protected constructor() {
    super('abalone');
  }

  override clone(): Abalone {
    return super.clone() as Abalone;
  }

  static override getClass() {
    return this;
  }

  static override default(): Abalone {
    const pos = super.default();
    return pos as Abalone;
  }

  static override fromSetup(setup: Setup): Result<Abalone, PositionError> {
    return super.fromSetup(setup).map(v => {
      if (defined(setup.lastMove)) v.play(setup.lastMove);
      return v as Abalone;
    });
  }

  static override getInitialBoardFen(): string {
    return 'ss1SS/sssSSS/1ss1SS1/8/9/8/1SS1ss1/SSSsss/SS1ss';
  }

  static override getEmptyBoardFen(): string {
    return '5/6/7/8/9/8/7/6/5';
  }
}

registerAbaloneFenParser('abalone', fen => Abalone.readFen(fen, 0, 0).map(t => Abalone.fenSetupFromTuple(t)));
registerAbaloneFenWriter('abalone', board => Abalone.writeFen(board));
