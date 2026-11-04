import { makeFen, parseFen } from '../../fen';
import type { Role } from '../../types';
import { makeSquare, parseSquare, parseUci } from '../../util';
import type { GameFamily } from './GameFamily';

type FiveInARowClass = typeof GameFamily;

export const fiveInARowSupport = (variant: FiveInARowClass) => {
  const rules = variant.rules;
  const square = (key: string) => parseSquare(rules)(key)!;
  const keys = (squares: Iterable<number>) => new Set([...squares].map(makeSquare(rules)));

  const play = (pos: GameFamily, ...actions: string[]): GameFamily => {
    const next = pos.clone();
    for (const action of actions) {
      if (action === 'swap') {
        if (!next.canSwap()) throw new Error(`illegal ${action}`);
        next.swap();
      } else if (action === 'swap2') {
        if (!next.canSwap2()) throw new Error(`illegal ${action}`);
        next.swap2();
      } else if (action === 'offer10') {
        if (!next.canOffer10()) throw new Error(`illegal ${action}`);
        next.offer10();
      } else {
        const move = parseUci(rules)(action);
        if (!move || !next.isLegal(move)) throw new Error(`illegal ${action}`);
        next.play(move);
      }
    }
    return next;
  };

  const refused = (pos: GameFamily, action: string): boolean => {
    try {
      play(pos, action);
      return false;
    } catch {
      return true;
    }
  };

  const fen = (pos: GameFamily): string => makeFen(rules)(pos.toSetup());
  const stateFields = (pos: GameFamily): string => fen(pos).split(' ').slice(1).join(' ');
  const read = (fenStr: string): GameFamily => variant.fromSetup(parseFen(rules)(fenStr).unwrap()).unwrap();

  // a position in play holding these stones, read back through its fen so the turn follows from them
  const position = (stones: [string, Role][], blackSeat: 'p1' | 'p2' = 'p1'): GameFamily => {
    const pos = read(variant.getInitialFen('p1'));
    pos.openingStep = '-';
    pos.blackSeat = blackSeat;
    for (const [key, role] of stones) pos.stones.set(square(key), role);
    return read(fen(pos));
  };

  const dropNext = (pos: GameFamily, key: string): GameFamily =>
    play(pos, `${pos.nextColour() === 'b-piece' ? 'B' : 'W'}@${key}`);

  return { square, keys, play, refused, fen, stateFields, read, position, dropNext };
};

export const black = (...keys: string[]): [string, Role][] => keys.map(key => [key, 'b-piece']);
export const white = (...keys: string[]): [string, Role][] => keys.map(key => [key, 'w-piece']);
