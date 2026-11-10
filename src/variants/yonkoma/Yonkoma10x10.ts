import type { BoardDimensions, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Yonkoma10x10 extends GameFamily {
  static override height: BoardDimensions['ranks'] = 10;
  static override width: BoardDimensions['files'] = 10;
  static override rules: Rules = 'yonkoma10x10';

  static override getClass() {
    return this;
  }

  protected constructor() {
    super('yonkoma10x10');
  }
}
