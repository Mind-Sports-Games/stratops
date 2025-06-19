import { Result } from '@badrap/result';
import { Board } from '../../board';
import { PositionError } from '../../chess';
import type { Setup } from '../../setup';
import type { BoardDimensions, Move, Role, Rules } from '../../types';
import { charToRole, defined, parseSquare } from '../../util';
import { GameFamily } from './GameFamily';

export class MiniShogi extends GameFamily {
  static override height: BoardDimensions['ranks'] = 5;
  static override width: BoardDimensions['files'] = 5;
  static override rules: Rules = 'minishogi';

  static override default(): MiniShogi {
    return super.defaultBoard(new this()) as MiniShogi;
  }

  static override fromSetup(setup: Setup): Result<MiniShogi, PositionError> {
    return super.fromSetupAndPos(setup, new this()) as Result<MiniShogi, PositionError>;
  }

  static override getClass() {
    return this;
  }

  static parseUci = (str: string, board: Board): Move | undefined => {
    let promotion: Role | undefined;
    const square = parseSquare('minishogi');

    if (str[1] === '@') {
      const role = charToRole(str[0]);
      const to = square(str.slice(2));
      if (role && defined(to)) return { role, to };
    } else {
      let from = square(str.slice(0, 2));
      if (from === undefined) {
        return;
      }
      let to = square(str.slice(2, 4));
      if (to === undefined) {
        return;
      }

      // promotion
      if (str.length === 5) {
        const role = board.getRole(from);
        if (role === undefined) return;

        to = square(str.slice(2, 5));
        promotion = 'p' + role as Role;
        if (defined(from) && defined(to)) {
          return { from, to, promotion };
        }
      }

      if (str.length === 4) {
        from = square(str.slice(0, 2));
        to = square(str.slice(2, 4));
        if (defined(from) && defined(to)) return { from, to, promotion };
      }
    }
    return;
  };

  protected constructor() {
    super('minishogi');
  }
}
