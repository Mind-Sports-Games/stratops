import { Result } from '@badrap/result';
import { IllegalSetup, PositionError } from '../../chess';
import type { Setup } from '../../setup';
import { BoardDimensions, Rules } from '../../types';
import { defined } from '../../util.js';
import { GameFamily } from './GameFamily';

export class Abalone extends GameFamily {
  static override height: BoardDimensions['ranks'] = 9;
  static override width: BoardDimensions['files'] = 9;
  static override rules: Rules = 'abalone';

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

  static override getClass() {
    return this;
  }

  override clone(): Abalone {
    return super.clone() as Abalone;
  }

  protected constructor() {
    super('abalone');
  }

  protected override validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));

    return Result.ok(undefined);
  }
}
