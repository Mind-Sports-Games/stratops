import {Result} from '@badrap/result';
import {IllegalSetup, PositionError} from '../../chess';
import type {Setup} from '../../setup';
import type {PlayerIndex} from '../../types';
import {type ExtendedMoveInfo, GameFamilyKey, type LegacyNotationBoard, NotationStyle, VariantKey,} from '../types';
import {Variant} from '../Variant';
import {add, areEqual, dist, div, getNeighVectors, getNextCore, getPrevCore, includes, key2pos, matchKeys, MoveNotation, mult, norm, type Pos, pos2key, sub} from "./util";
import {Board} from "../../board";
import {charToPiece, FenError, InvalidFen, parseFullMoves, parsePlayerTurn, parsePliesRemainingThisTurn, parseScore} from "../../fen";
import * as fp from "../../fp";
import {variantKeyToRules} from "../util";
import {Abalone} from "./Abalone";
import {GrandAbalone} from "./GrandAbalone";

export abstract class GameFamily extends Variant {
	static override family: GameFamilyKey = GameFamilyKey.abalone;
	
	static override getVariantKeys(): VariantKey[] {
		return [
			VariantKey.abalone,
			VariantKey.grandAbalone
		];
	}
	
	//
	//
	override clone(): GameFamily {
		return super.clone() as GameFamily;
	}
	
	static override fromSetup(setup: Setup): Result<GameFamily, PositionError> {
		return super.fromSetup(setup) as Result<GameFamily, PositionError>;
	}
	
	override hasInsufficientMaterial(_playerIndex: PlayerIndex): boolean {
		return false;// Having only one remaining piece for each player could be considered as insufficient material, but never happens from an official starting position
	}
	
	protected override validate(): Result<undefined, PositionError> {
		return this.board.occupied.isEmpty()?
			Result.err(new PositionError(IllegalSetup.Empty)):
			Result.ok(undefined);
	}
	
	//
	//
	static getMaxUsable(): number | undefined {
		return 3;
	}
	
	static getWinningScore(): number {
		return 6;
	}
	
	static hasPrevPlayer(): boolean {
		return false;
	}
	
	//
	// Cells
	static getCentre(): Pos {
		return [Math.floor(this.width/2), Math.floor(this.height/2)];
	}
	
	static isCell(pos: Pos): boolean {
		return this.isCellCore(this.getCentre(), pos);
	}
	
	static isCellCore(centre: Pos, pos: Pos): boolean {
		return dist(centre, pos) <= centre[0];
	}
	
	static getCellList(): Pos[] {
		const centre = this.getCentre();
		const res: Pos[] = [];
		
		for (let y = this.height - 1; y >= 0; y--) {
			for (let x = 0; x < this.width; x++) {
				const pos: Pos = [x, y];
				if (this.isCellCore(centre, pos)) res.push(pos);
			}
		}
		
		return res;
	}
	
	//
	// Notation
	static override getNotationStyle(): NotationStyle {
		return NotationStyle.abl;
	}
	
	static override computeMoveNotation(move: ExtendedMoveInfo): string {
		return this.computeMoveNotationCore(move, MoveNotation.PlayStrategy);
	}
	
	static computeMoveNotationCore(move: ExtendedMoveInfo, notation: MoveNotation): string {
		const board = this.readThisFen_board(move.prevFen);
		
		if (board.isOk) {
			const m = this.uciToMove(move.uci), from = m[0];
			
			const c = board.value.get(this.getFenIndex(from));
			
			if (c !== undefined) {
				let to = m[1], vect = sub(to, from);
				
				let n = norm(vect);
				
				if (n > 0) {
					let uvect = div(n, vect);
					const neighVectors = getNeighVectors();
					
					if (includes(neighVectors, uvect)) {// In-line move
						let sep = '';
						
						switch (notation) {
							default:
							case MoveNotation.AbaPro:
								to = add(from, uvect);
								break;
							case MoveNotation.Nacre: {
								to = from;
								while (board.value.get(this.getFenIndex(to)) === c) to = add(to, uvect);
								break;
							}
							case MoveNotation.Nacre_extended: {
								const tto = to;
								to = from;
								
								while (board.value.get(this.getFenIndex(to)) !== undefined) to = add(to, uvect);
								
								if (areEqual(from, to)) to = tto;
								break;
							}
							case MoveNotation.PlayStrategy: {
								const tto = to;
								to = from;
								
								while (board.value.get(this.getFenIndex(to)) !== undefined) to = add(to, uvect);
								
								if (areEqual(from, to)) to = tto;
								else if (!this.isCell(to)) {// Ejection
									to = sub(to, uvect);
									sep = '×';
								}
								break;
							}
						}
						
						return pos2key(from) + sep + pos2key(to);
					} else {// Broadside move
						switch (notation) {
							default:
								return pos2key(from) + pos2key(to);// Assumes (correctly) the two positions are not reversed
							case MoveNotation.AbaPro: {
								n--;
								let found = false, vvect: Pos = [0, 0], _nvect: Pos = [0, 0];
								
								for (const _vect of neighVectors) {
									_nvect = mult(n, _vect);
									
									if (board.value.get(this.getFenIndex(add(from, _nvect))) === c) {
										vvect = getNextCore(neighVectors, _vect);
										
										if (areEqual(add(_nvect, vvect), vect)) {
											found = true;
											break;
										} else {
											vvect = getPrevCore(neighVectors, _vect);
											
											if (areEqual(add(_nvect, vvect), vect)) {
												found = true;
												break;
											}
										}
									}
								}
								
								if (found) return pos2key(from) + pos2key(add(from, _nvect)) + pos2key(add(from, vvect));
								break;
							}
						}
					}
				}
			}
		}
		
		return '?';
	}
	
	static uciToMove(uci: string):
		[Pos, Pos] {
		const reg = matchKeys(uci);
		return [key2pos(reg[0]), key2pos(reg[1])];
	}
	
	//
	// FEN
	static readThisFen(rules: string, fen: string): Result<[Board, number, number, PlayerIndex, number, number], FenError> {
		for (const variant of GameFamily.getVariantKeys()) {
			if (variantKeyToRules(variant) === rules) switch (variant) {
				default:
				case VariantKey.abalone:
					return Abalone.readThisFenCore(fen);
				case VariantKey.grandAbalone:
					return GrandAbalone.readThisFenCore(fen);
			}
		}
		
		return Abalone.readThisFenCore(fen);
	}
	
	protected static readThisFenCore(fen: string): Result<[Board, number, number, PlayerIndex, number, number], FenError> {
		const [boardPart, ...parts] = fen.split(' ');
		if (parts.length < 5) return Result.err(new FenError(InvalidFen.Fen));
		
		return fp.resultZip([
			this.readThisFen_board(boardPart),
			parseScore(parts[0]),
			parseScore(parts[1]),
			parsePlayerTurn('b', 'w')(parts[2]),
			parseFullMoves(parts[3]),
			parsePliesRemainingThisTurn(parts.length < 6? undefined: parts[5]),
		]);
	}
	
	protected static readThisFen_board(fen: string): Result<Board, FenError> {
		const board = Board.empty(this.rules),
			cells = this.getCellList();
		
		let k = 0;
		for (let i = 0; i < fen.length; i++) {
			const c = fen[i];
			
			if (c === ' ') break;
			else if (c !== '/') {
				const steps = parseInt(c);
				
				if (steps > 0) k += steps;
				else {
					const piece = charToPiece(c);
					if (!piece || k++ >= cells.length) return Result.err(new FenError(InvalidFen.Board));
					
					board.set(this.getFenIndex(cells[k]), piece);
				}
			}
		}
		
		return Result.ok(board);
	}
	
	protected static getFenIndex(pos: Pos): number {
		return pos[0] + pos[1]*this.width;
	}
}