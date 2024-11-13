import { Result } from "@badrap/result";

import { Chess, IllegalSetup, PositionError } from "../../chess";
import { Setup } from "../../setup";
import { PlayerIndex } from "../../types";
import { defined } from '../../util.js';

// @TODO VFR: rewrite this properly
export class Abalone extends Chess {
    protected constructor() {
      super('abalone');

    }
  
    static default(): Abalone {
      const pos = super.default();
      return pos as Abalone;
    }
  
    static fromSetup(setup: Setup): Result<Abalone, PositionError> {
      return super.fromSetup(setup).map(v => {
        if (defined(setup.lastMove)) v.play(setup.lastMove);
        return v as Abalone;
      });
    }
  
    clone(): Abalone {
      return super.clone() as Abalone;
    }
  
    hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
      return false;
    }

    protected validate(): Result<undefined, PositionError> {
        if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
  
        return Result.ok(undefined);
    }
  }
  