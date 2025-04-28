import type { Rules } from '../types';
import { Abalone } from './abalone/Abalone';
import { Amazons } from './amazons/Amazons';
import { Backgammon } from './backgammon/Backgammon';
import { Hyper } from './backgammon/Hyper';
import { Nackgammon } from './backgammon/Nackgammon';
import { Breakthrough } from './breakthrough/Breakthrough';
import { MiniBreakthrough } from './breakthrough/MiniBreakthrough';
import { Antichess } from './chess/Antichess';
import { Atomic } from './chess/Atomic';
import { Chess } from './chess/Chess';
import { Crazyhouse } from './chess/Crazyhouse';
import { FiveCheck } from './chess/FiveCheck';
import { Horde } from './chess/Horde';
import { KingOfTheHill } from './chess/KingOfTheHill';
import { Monster } from './chess/Monster';
import { NoCastling } from './chess/NoCastling';
import { RacingKings } from './chess/RacingKings';
import { ThreeCheck } from './chess/ThreeCheck';
import { Go13x13 } from './go/Go13x13';
import { Go19x19 } from './go/Go19x19';
import { Go9x9 } from './go/Go9x9';
import { LinesOfAction } from './linesofaction/LinesOfAction';
import { ScrambledEggs } from './linesofaction/ScrambledEggs';
import { GrandOthello } from './othello/GrandOthello';
import { Othello } from './othello/Othello';
import { Oware } from './oware/Oware';
import { MiniShogi } from './shogi/MiniShogi';
import { Shogi } from './shogi/Shogi';
import { Bestemshe } from './togyzkumalak/Bestemshe';
import { Togyzkumalak } from './togyzkumalak/Togyzkumalak';
import { ExtendedMoveInfo, NotationStyle } from './types';
import { Variant } from './Variant';
import { MiniXiangqi } from './xiangqi/MiniXiangqi';
import { Xiangqi } from './xiangqi/Xiangqi';

export function getClassFromRules(rules: Rules): typeof Variant {
  switch (rules) {
    case 'chess':
      return Chess.getClass();
    case 'antichess':
      return Antichess.getClass();
    case 'atomic':
      return Atomic.getClass();
    case 'horde':
      return Horde.getClass();
    case 'racingkings':
      return RacingKings.getClass();
    case 'kingofthehill':
      return KingOfTheHill.getClass();
    case '3check':
      return ThreeCheck.getClass();
    case '5check':
      return FiveCheck.getClass();
    case 'crazyhouse':
      return Crazyhouse.getClass();
    case 'nocastling':
      return NoCastling.getClass();
    case 'monster':
      return Monster.getClass();
    case 'linesofaction':
      return LinesOfAction.getClass();
    case 'scrambledeggs':
      return ScrambledEggs.getClass();
    case 'shogi':
      return Shogi.getClass();
    case 'minishogi':
      return MiniShogi.getClass();
    case 'xiangqi':
      return Xiangqi.getClass();
    case 'minixiangqi':
      return MiniXiangqi.getClass();
    case 'flipello':
      return Othello.getClass();
    case 'flipello10':
      return GrandOthello.getClass();
    case 'amazons':
      return Amazons.getClass();
    case 'oware':
      return Oware.getClass();
    case 'togyzkumalak':
      return Togyzkumalak.getClass();
    case 'bestemshe':
      return Bestemshe.getClass();
    case 'go9x9':
      return Go9x9.getClass();
    case 'go13x13':
      return Go13x13.getClass();
    case 'go19x19':
      return Go19x19.getClass();
    case 'backgammon':
      return Backgammon.getClass();
    case 'hyper':
      return Hyper.getClass();
    case 'nackgammon':
      return Nackgammon.getClass();
    case 'breakthrough':
      return Breakthrough.getClass();
    case 'minibreakthrough':
      return MiniBreakthrough.getClass();
    case 'abalone':
      return Abalone.getClass();
  }
}
