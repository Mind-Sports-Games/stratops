import { Result } from '@badrap/result';
import { Board } from '../../board';
import type { Context, PositionError } from '../../chess';
import { type FenError, parseFen } from '../../fen';
import { Material, type Setup } from '../../setup';
import { SquareSet } from '../../squareSet';
import {
  type BoardDimensions,
  isDrop,
  type Move,
  type Outcome,
  type PlayerIndex,
  type Role,
  type Square,
} from '../../types';
import { opposite } from '../../util';
import { ExtendedMoveInfo, GameFamilyKey, LexicalUci, NotationStyle, VariantKey } from '../types';
import { Variant } from '../Variant';

type Line = (Role | undefined)[];

const ROUNDS = 2;

export abstract class GameFamily extends Variant {
  static override height: BoardDimensions['ranks'] = 7;
  static override width: BoardDimensions['files'] = 7;
  static override family: GameFamilyKey = GameFamilyKey.entropy;

  round = 1;
  p1Score = 0;
  p2Score = 0;

  static override computeMoveNotation(move: ExtendedMoveInfo): string {
    if (move.uci.startsWith('draw')) return '';
    return move.uci;
  }

  static override combinedNotation(actionNotations: string[]): string {
    return actionNotations.filter(notation => notation !== '').join(' ');
  }

  static override getNotationStyle(): NotationStyle {
    return NotationStyle.uci;
  }

  static override getVariantKeys(): VariantKey[] {
    return [VariantKey.entropy];
  }

  static override getEmptyBoardFen(): string {
    return '7/7/7/7/7/7/7';
  }

  static override getInitialBoardFen(): string {
    return this.getEmptyBoardFen();
  }

  static override getEmptyFen(playerIndex: PlayerIndex): string {
    return this.getInitialFen(playerIndex);
  }

  static override getInitialFen(playerIndex: PlayerIndex): string {
    return `${this.getInitialBoardFen()}[] ${this.playerFENChars[playerIndex]} 0 0 1 1`;
  }

  static override parseFen(fen: string): Result<Setup, FenError> {
    return parseFen(this.rules)(fen);
  }

  static override getScoreFromFen(fen: string, playerIndex: string): number | undefined {
    return +fen.split(' ')[playerIndex === 'p1' ? 2 : 3];
  }

  static override parseLexicalUci(uci: string): LexicalUci | undefined {
    if (!uci || uci === 'pass' || uci.startsWith('draw')) return undefined;
    return super.parseLexicalUci(uci);
  }

  static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
    return (super.fromSetup(setup) as Result<GameFamily, PositionError>).map(pos => {
      pos.pockets = setup.pockets?.clone() ?? Material.empty();
      pos.round = setup.round ?? 1;
      pos.p1Score = setup.p1Score ?? 0;
      pos.p2Score = setup.p2Score ?? 0;
      return pos;
    });
  }

  static guaranteedScore(board: Board): number {
    return this.lines(board).reduce((total, line) => total + this.scoreLine(line), 0);
  }

  static scoreLine(line: Line): number {
    let score = 0;
    for (let start = 0; start < line.length; start++) {
      for (let end = start + 2; end <= line.length; end++) {
        const run = line.slice(start, end);
        if (this.isGuaranteedPalindrome(run)) score += run.length;
      }
    }
    return score;
  }

  private static isGuaranteedPalindrome(run: Line): boolean {
    const n = run.length;
    const gaps = run.flatMap((role, i) => (role ? [] : [i]));
    const onlyGapIsCentre = gaps.length === 0 || (n % 2 === 1 && gaps.length === 1 && gaps[0] === (n - 1) / 2);
    if (n < 2 || !onlyGapIsCentre) return false;
    for (let i = 0; i < Math.floor(n / 2); i++) {
      if (!run[i] || run[i] !== run[n - 1 - i]) return false;
    }
    return true;
  }

  private static lines(board: Board): Line[] {
    const indices = [...Array(this.width).keys()];
    const rows = indices.map(rank => indices.map(file => board.get(rank * this.width + file)?.role));
    const columns = indices.map(file => indices.map(rank => board.get(rank * this.width + file)?.role));
    return [...rows, ...columns];
  }

  private static squares(): Square[] {
    return [...Array(this.width * this.height).keys()];
  }

  chaosPlayer(): PlayerIndex {
    return this.round === 1 ? 'p1' : 'p2';
  }

  orderPlayer(): PlayerIndex {
    return opposite(this.chaosPlayer());
  }

  isChaos(): boolean {
    return this.turn === this.chaosPlayer();
  }

  isOrder(): boolean {
    return this.turn === this.orderPlayer();
  }

  counterInPocket(): Role | undefined {
    const pocket = this.pockets?.[this.turn];
    if (!pocket) return undefined;
    return (Object.keys(pocket) as Role[]).find(role => pocket[role] > 0);
  }

  mustDraw(): boolean {
    return this.isChaos() && !this.counterInPocket() && !this.isVariantEnd();
  }

  canPass(): boolean {
    return this.isOrder() && !this.isVariantEnd();
  }

  isBoardFull(): boolean {
    return this.board.occupied.size() === GameFamily.width * GameFamily.height;
  }

  override ctx(): Context {
    return {
      king: undefined,
      blockers: SquareSet.empty(),
      checkers: SquareSet.empty(),
      variantEnd: this.isVariantEnd(),
      mustCapture: false,
    };
  }

  override dests(square: Square, ctx?: Context): SquareSet {
    if ((ctx ? ctx.variantEnd : this.isVariantEnd()) || !this.isOrder()) return SquareSet.empty();
    if (this.board.get(square)?.playerIndex !== this.turn) return SquareSet.empty();

    const { width, height } = GameFamily;
    const file = square % width;
    const rank = Math.floor(square / width);
    let dests = SquareSet.empty();
    for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let f = file + df;
      let r = rank + dr;
      while (f >= 0 && f < width && r >= 0 && r < height && !this.board.occupied.has(r * width + f)) {
        dests = dests.with(r * width + f);
        f += df;
        r += dr;
      }
    }
    return dests;
  }

  override dropDests(ctx?: Context): SquareSet {
    if ((ctx ? ctx.variantEnd : this.isVariantEnd()) || !this.isChaos() || !this.counterInPocket()) {
      return SquareSet.empty();
    }
    return GameFamily.squares().reduce(
      (dests, square) => (this.board.occupied.has(square) ? dests : dests.with(square)),
      SquareSet.empty(),
    );
  }

  override isLegal(move: Move, ctx?: Context): boolean {
    if (isDrop(move)) return this.counterInPocket() === move.role && this.dropDests(ctx).has(move.to);
    return !move.promotion && this.dests(move.from, ctx).has(move.to);
  }

  override play(move: Move): void {
    const actor = this.turn;
    if (isDrop(move)) {
      if (this.pockets) this.pockets[actor][move.role]--;
      this.board.set(move.to, { role: move.role, playerIndex: this.orderPlayer() });
    } else {
      const piece = this.board.take(move.from);
      if (piece) this.board.set(move.to, piece);
    }
    this.endTurn(actor);
  }

  pass(): void {
    this.endTurn(this.turn);
  }

  draw(role: Role): void {
    // a full board is the finished round's, left standing until the next round's first draw
    if (this.isBoardFull() && !this.isVariantEnd()) {
      this.board = Board.empty(this.rules);
      this.pockets = Material.empty();
    }
    this.pockets = this.pockets ?? Material.empty();
    this.pockets[this.turn][role]++;
  }

  private endTurn(actor: PlayerIndex): void {
    const score = GameFamily.guaranteedScore(this.board);
    if (this.orderPlayer() === 'p1') this.p1Score = score;
    else this.p2Score = score;

    // a round closes on the drop that fills the board, so the turn passes to the next round's chaos
    if (this.isBoardFull() && actor === this.chaosPlayer()) this.round += 1;

    this.halfmoves += 1;
    if (actor === 'p2') this.fullmoves += 1;
    this.turn = opposite(actor);
  }

  override toSetup(): Setup {
    return {
      ...super.toSetup(),
      round: this.round,
      p1Score: this.p1Score,
      p2Score: this.p2Score,
    };
  }

  override clone(): GameFamily {
    const pos = super.clone() as GameFamily;
    pos.round = this.round;
    pos.p1Score = this.p1Score;
    pos.p2Score = this.p2Score;
    return pos;
  }

  protected override validate(): Result<undefined, PositionError> {
    return Result.ok(undefined);
  }

  override isVariantEnd(): boolean {
    return this.round > ROUNDS;
  }

  override variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;
    if (this.p1Score === this.p2Score) return { winner: undefined };
    return { winner: this.p1Score > this.p2Score ? 'p1' : 'p2' };
  }

  override isEnd(ctx?: Context): boolean {
    return ctx ? ctx.variantEnd : this.isVariantEnd();
  }

  override isCheckmate(): boolean {
    return false;
  }

  override isStalemate(): boolean {
    return false;
  }

  override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
    return false;
  }

  override outcome(ctx?: Context): Outcome | undefined {
    return this.variantOutcome(ctx);
  }
}
