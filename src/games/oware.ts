import { Result } from '@badrap/result';

import { Chess, PositionError } from '../chess';
import { Setup } from '../setup';
import { PlayerIndex } from '../types';

export class Oware extends Chess {
  // TODO - move into own class and have variant family
  protected constructor() {
    super('oware');
  }

  static default(): Oware {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<Oware, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): Oware {
    return super.clone() as Oware;
  }

  hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }
}
