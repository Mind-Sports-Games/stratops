import { Result } from '@badrap/result';
import { Context, PositionError } from '../../chess';
import { Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import { Outcome, PlayerIndex, PLAYERINDEXES, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class KingOfTheHill extends GameFamily {
  static override rules: Rules = 'kingofthehill';

  static override default(): KingOfTheHill {
    return super.default();
  }

  static override fromSetup(setup: Setup): Result<KingOfTheHill, PositionError> {
    return super.fromSetup(setup);
  }

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('kingofthehill');
  }

  override clone(): KingOfTheHill {
    return super.clone() as KingOfTheHill;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }

  override isVariantEnd(): boolean {
    return this.board['k-piece'].intersects(SquareSet.center64());
  }

  override variantOutcome(_ctx?: Context): Outcome | undefined {
    for (const playerIndex of PLAYERINDEXES) {
      if (this.board.pieces(playerIndex, 'k-piece').intersects(SquareSet.center64())) return { winner: playerIndex };
    }
    return;
  }
}
