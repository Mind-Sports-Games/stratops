import { Result } from '@badrap/result';
import { Chess, Context, PositionError } from '../../chess';
import { Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import { Outcome, PlayerIndex, PLAYERINDEXES } from '../../types';
import { Variant } from '../Variant';

export class KingOfTheHill extends Variant {
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
