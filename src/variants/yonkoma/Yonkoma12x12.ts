import type { BoardDimensions, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Yonkoma12x12 extends GameFamily {
  static override height: BoardDimensions['ranks'] = 12;
  static override width: BoardDimensions['files'] = 12;
  static override rules: Rules = 'yonkoma12x12';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('yonkoma12x12');
  }
}
