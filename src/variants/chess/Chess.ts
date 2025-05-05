import type { Result } from '@badrap/result';
import type { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import { GameFamily } from './GameFamily';

export class Chess extends GameFamily {
  static override default(): Chess {
    return super.default() as Chess;
  }

  static override fromSetup(setup: Setup): Result<Chess, PositionError> {
    return super.fromSetup(setup) as Result<Chess, PositionError>;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('chess');
  }
}
