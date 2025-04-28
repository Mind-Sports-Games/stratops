import type { Result } from '@badrap/result';
import type { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { BoardDimensions } from '../../types';
import { defined } from '../../util';
import { GameFamily } from './GameFamily';

export class Amazons extends GameFamily {
  static override height: BoardDimensions['ranks'] = 10;
  static override width: BoardDimensions['files'] = 10;

  static override default(): Amazons {
    const pos = super.default();
    return pos as Amazons;
  }

  static override fromSetup(setup: Setup): Result<Amazons, PositionError> {
    return super.fromSetup(setup).map(v => {
      if (defined(setup.lastMove)) v.play(setup.lastMove);
      return v as Amazons;
    });
  } // TODO: override toSetup to include half move.

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('amazons');
  }
}
