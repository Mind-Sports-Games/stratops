import { Result } from '@badrap/result';
import { Castles, PositionError } from '../../chess';
import { Setup } from '../../setup';
import { Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class NoCastling extends GameFamily {
  static override allowCastling: boolean = false;
  static override rules: Rules = 'nocastling';

  static override default(): NoCastling {
    const pos = super.default();
    pos.castles = Castles.empty();
    return pos as NoCastling;
  }

  static override getInitialEpd(): string {
    return `${this.playerFENChars['p1']} - -`;
  }

  static override fromSetup(setup: Setup): Result<NoCastling, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.castles = Castles.empty();
      return pos as NoCastling;
    });
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('nocastling');
  }

  override clone(): NoCastling {
    return super.clone() as NoCastling;
  }
}
