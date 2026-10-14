import { parseFen } from '../../fen';
import type { BoardDimensions, Rules } from '../../types';
import { GameFamily } from './GameFamily';

export class Pente extends GameFamily {
  static override rules: Rules = 'pente';
  static override height: BoardDimensions['ranks'] = 19;
  static override width: BoardDimensions['files'] = 19;
  static override captureTarget: number | undefined = 10;

  static override default(): Pente {
    return this.fromSetup(parseFen(this.rules)(this.getInitialFen('p1')).unwrap()).unwrap() as Pente;
  }

  static override getClass() {
    return this;
  }

  // the stones each seat has captured
  static override getScoreFromFen(fen: string, playerIndex: string): number | undefined {
    return +fen.split(' ')[playerIndex === 'p1' ? 4 : 5];
  }

  protected constructor() {
    super('pente');
  }
}
