import type { Rules } from '../types';
import { Abalone } from './abalone/Abalone';
import { GameFamily as AbaloneGameFamily } from './abalone/GameFamily';
import { Amazons } from './amazons/Amazons';
import { GameFamily as AmazonsGameFamily } from './amazons/GameFamily';
import { Backgammon } from './backgammon/Backgammon';
import { GameFamily as BackgammonGameFamily } from './backgammon/GameFamily';
import { Hyper } from './backgammon/Hyper';
import { Nackgammon } from './backgammon/Nackgammon';
import { Breakthrough } from './breakthrough/Breakthrough';
import { GameFamily as BreakthroughGameFamily } from './breakthrough/GameFamily';
import { MiniBreakthrough } from './breakthrough/MiniBreakthrough';
import { Antichess } from './chess/Antichess';
import { Atomic } from './chess/Atomic';
import { Chess } from './chess/Chess';
import { Crazyhouse } from './chess/Crazyhouse';
import { FiveCheck } from './chess/FiveCheck';
import { GameFamily as ChessGameFamily } from './chess/GameFamily';
import { Horde } from './chess/Horde';
import { KingOfTheHill } from './chess/KingOfTheHill';
import { Monster } from './chess/Monster';
import { NoCastling } from './chess/NoCastling';
import { RacingKings } from './chess/RacingKings';
import { ThreeCheck } from './chess/ThreeCheck';
import { Dameo } from './dameo/Dameo';
import { GameFamily as DameoGameFamily } from './dameo/GameFamily';
import { Antidraughts } from './draughts/Antidraughts';
import { Brazilian } from './draughts/Brazilian';
import { Brkthru } from './draughts/Brkthru';
import { English } from './draughts/English';
import { Frisian } from './draughts/Frisian';
import { Frysk } from './draughts/Frysk';
import { GameFamily as DraughtsGameFamily } from './draughts/GameFamily';
import { International } from './draughts/International';
import { Pool } from './draughts/Pool';
import { Portuguese } from './draughts/Portuguese';
import { Russian } from './draughts/Russian';
import { GameFamily as GoGameFamily } from './go/GameFamily';
import { Go13x13 } from './go/Go13x13';
import { Go19x19 } from './go/Go19x19';
import { Go9x9 } from './go/Go9x9';
import { GameFamily as LinesOfActionGameFamily } from './linesofaction/GameFamily';
import { LinesOfAction } from './linesofaction/LinesOfAction';
import { ScrambledEggs } from './linesofaction/ScrambledEggs';
import { GameFamily as OthelloGameFamily } from './othello/GameFamily';
import { GrandOthello } from './othello/GrandOthello';
import { Othello } from './othello/Othello';
import { GameFamily as OwareGameFamily } from './oware/GameFamily';
import { Oware } from './oware/Oware';
import { GameFamily as ShogiGameFamily } from './shogi/GameFamily';
import { MiniShogi } from './shogi/MiniShogi';
import { Shogi } from './shogi/Shogi';
import { Bestemshe } from './togyzkumalak/Bestemshe';
import { GameFamily as TogyzkumalakGameFamily } from './togyzkumalak/GameFamily';
import { Togyzkumalak } from './togyzkumalak/Togyzkumalak';
import { GameFamilyKey, VariantKey } from './types';
import { Variant } from './Variant';
import { GameFamily as XiangqiGameFamily } from './xiangqi/GameFamily';
import { MiniXiangqi } from './xiangqi/MiniXiangqi';
import { Xiangqi } from './xiangqi/Xiangqi';

export function variantClass(rules: Rules): typeof Variant {
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
    case 'international':
      return International.getClass();
    case 'antidraughts':
      return Antidraughts.getClass();
    case 'brkthru':
      return Brkthru.getClass();
    case 'russian':
      return Russian.getClass();
    case 'brazilian':
      return Brazilian.getClass();
    case 'pool':
      return Pool.getClass();
    case 'portuguese':
      return Portuguese.getClass();
    case 'english':
      return English.getClass();
    case 'frisian':
      return Frisian.getClass();
    case 'frysk':
      return Frysk.getClass();
    case 'dameo':
      return Dameo.getClass();
    default:
      return Variant.getClass();
  }
}

export function variantClassFromKey(variantKey: VariantKey | string): typeof Variant {
  return variantClass(variantKeyToRules(variantKey));
}

export function variantKeyToRules(variantKey?: VariantKey | string): Rules {
  switch (variantKey) {
    case VariantKey.standard:
    case VariantKey.chess960:
    case VariantKey.fromPosition:
      return 'chess';
    case VariantKey.antichess:
      return 'antichess';
    case VariantKey.kingOfTheHill:
      return 'kingofthehill';
    case VariantKey.threeCheck:
      return '3check';
    case VariantKey.fiveCheck:
      return '5check';
    case VariantKey.atomic:
      return 'atomic';
    case VariantKey.horde:
      return 'horde';
    case VariantKey.racingKings:
      return 'racingkings';
    case VariantKey.crazyhouse:
      return 'crazyhouse';
    case VariantKey.noCastling:
      return 'nocastling';
    case VariantKey.monster:
      return 'monster';
    case VariantKey.linesOfAction:
      return 'linesofaction';
    case VariantKey.scrambledEggs:
      return 'scrambledeggs';
    case VariantKey.shogi:
      return 'shogi';
    case VariantKey.minishogi:
      return 'minishogi';
    case VariantKey.xiangqi:
      return 'xiangqi';
    case VariantKey.minixiangqi:
      return 'minixiangqi';
    case VariantKey.flipello:
      return 'flipello';
    case VariantKey.flipello10:
      return 'flipello10';
    case VariantKey.amazons:
      return 'amazons';
    case VariantKey.breakthroughtroyka:
      return 'breakthrough';
    case VariantKey.minibreakthroughtroyka:
      return 'minibreakthrough';
    case VariantKey.oware:
      return 'oware';
    case VariantKey.togyzkumalak:
      return 'togyzkumalak';
    case VariantKey.bestemshe:
      return 'bestemshe';
    case VariantKey.go9x9:
      return 'go9x9';
    case VariantKey.go13x13:
      return 'go13x13';
    case VariantKey.go19x19:
      return 'go19x19';
    case VariantKey.backgammon:
      return 'backgammon';
    case VariantKey.hyper:
      return 'hyper';
    case VariantKey.nackgammon:
      return 'nackgammon';
    case VariantKey.abalone:
      return 'abalone';
    case VariantKey.international:
    case VariantKey.fromPositionDraughts:
      return 'international';
    case VariantKey.antidraughts:
      return 'antidraughts';
    case VariantKey.breakthrough:
      return 'brkthru';
    case VariantKey.russian:
      return 'russian';
    case VariantKey.brazilian:
      return 'brazilian';
    case VariantKey.pool:
      return 'pool';
    case VariantKey.portuguese:
      return 'portuguese';
    case VariantKey.english:
      return 'english';
    case VariantKey.frisian:
      return 'frisian';
    case VariantKey.frysk:
      return 'frysk';
    case VariantKey.dameo:
      return 'dameo';
    default:
      return 'chess';
  }
}

export function gameFamilyClass(gameFamilyKey?: GameFamilyKey): typeof Variant {
  switch (gameFamilyKey) {
    case GameFamilyKey.abalone:
      return AbaloneGameFamily.getClass();
    case GameFamilyKey.draughts:
      return DraughtsGameFamily.getClass();
    case GameFamilyKey.dameo:
      return DameoGameFamily.getClass();
    case GameFamilyKey.chess:
      return ChessGameFamily.getClass();
    case GameFamilyKey.loa:
      return LinesOfActionGameFamily.getClass();
    case GameFamilyKey.shogi:
      return ShogiGameFamily.getClass();
    case GameFamilyKey.xiangqi:
      return XiangqiGameFamily.getClass();
    case GameFamilyKey.flipello:
      return OthelloGameFamily.getClass();
    case GameFamilyKey.amazons:
      return AmazonsGameFamily.getClass();
    case GameFamilyKey.breakthroughtroyka:
      return BreakthroughGameFamily.getClass();
    case GameFamilyKey.oware:
      return OwareGameFamily.getClass();
    case GameFamilyKey.togyzkumalak:
      return TogyzkumalakGameFamily.getClass();
    case GameFamilyKey.go:
      return GoGameFamily.getClass();
    case GameFamilyKey.backgammon:
      return BackgammonGameFamily.getClass();
    default:
      return Variant.getClass();
  }
}
