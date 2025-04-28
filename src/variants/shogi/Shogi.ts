import type { Result } from '@badrap/result';
import type { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { BoardDimensions } from '../../types';
import { GameFamily } from './GameFamily';

export class Shogi extends GameFamily {
  static override height: BoardDimensions['ranks'] = 9;
  static override width: BoardDimensions['files'] = 9;

  static override default(): Shogi {
    return super.defaultBoard(new this()) as Shogi;
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return super.fromSetupAndPos(setup, new this()) as Result<GameFamily, PositionError>;
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('shogi');
  }
}
