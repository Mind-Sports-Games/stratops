import { Setup } from '../../setup';
import { XiangqiFamily } from './xiangqifamily';

export class Xiangqi extends XiangqiFamily {
  protected constructor() {
    super('xiangqi');
  }

  static default(): Xiangqi {
    return super.defaultBoard(new this()) as Xiangqi;
  }

  static fromSetup(setup: Setup) {
    return super.validSetup(setup, new this());
  }
}
