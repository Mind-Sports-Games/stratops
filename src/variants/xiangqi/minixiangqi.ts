import { Setup } from '../../setup';
import { XiangqiFamily } from './xiangqifamily';

export class MiniXiangqi extends XiangqiFamily {
  protected constructor() {
    super('minixiangqi');
  }

  static default(): MiniXiangqi {
    return super.defaultBoard(new this()) as MiniXiangqi;
  }

  static fromSetup(setup: Setup) {
    return super.validSetup(setup, new this());
  }
}
