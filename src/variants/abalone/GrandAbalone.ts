import { type Result } from '@badrap/result';
import { type PositionError } from '../../chess';
import { registerAbaloneFenParser, registerAbaloneFenWriter } from '../../fen';
import type { Setup } from '../../setup';
import { type BoardDimensions, type Rules } from '../../types';
import { defined } from '../../util.js';
import { GameFamily } from './GameFamily';

export class GrandAbalone extends GameFamily {
  static override rules: Rules = 'grandabalone';
  static override height: BoardDimensions['ranks'] = 11;
  static override width: BoardDimensions['files'] = 11;
  static override startingPieceCount = 21;
  static override winningScore = 10;

  protected constructor() {
    super('grandabalone');
  }

  override clone(): GrandAbalone {
    return super.clone() as GrandAbalone;
  }

  static override getClass() {
    return this;
  }

  static override default(): GrandAbalone {
    return super.default() as GrandAbalone;
  }

  static override fromSetup(setup: Setup): Result<GrandAbalone, PositionError> {
    return super.fromSetup(setup).map(v => {
      if (defined(setup.lastMove)) v.play(setup.lastMove);
      return v as GrandAbalone;
    });
  }

  //
  //
  static override getMaxUsable(): number | undefined {
    return 4;
  }

  static override hasPrevPlayer(): boolean {
    return true;
  }

  static override getInitialBoardFen(): string {
    return 'SS2ss/SSS1sss/1SS2ss1/9/ss6SS/sss5SSS/ss6SS/9/1SS2ss1/SSS1sss/SS2ss';
  }

  static override getEmptyBoardFen(): string {
    return '6/7/8/9/10/11/10/9/8/7/6';
  }
}

registerAbaloneFenParser(
  'grandabalone',
  fen => GrandAbalone.readFen(fen, 0, 0).map(t => GrandAbalone.fenSetupFromTuple(t)),
);
registerAbaloneFenWriter('grandabalone', board => GrandAbalone.writeFen(board));
