import { Result } from '@badrap/result';
import { Setup } from '../../setup';
import { XiangqiFamily } from './xiangqifamily';
import { PositionError } from '../../chess';

export class MiniXiangqi extends XiangqiFamily {
  protected constructor() {
    super('minixiangqi');
  }

  static default(): MiniXiangqi {
    return super.defaultBoard(new this()) as MiniXiangqi;
  }

  static fromSetup(setup: Setup): Result<MiniXiangqi, PositionError> {
    return super.validSetup(setup, new this());
  }
}
