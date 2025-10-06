import {type Result} from '@badrap/result';
import {type PositionError} from '../../chess';
import type {Setup} from '../../setup';
import {type BoardDimensions, type Rules} from '../../types';
import {defined} from '../../util.js';
import {GameFamily} from './GameFamily';

export class GrandAbalone extends GameFamily {
	static override rules: Rules = 'grandabalone';
	static override height: BoardDimensions['ranks'] = 11;
	static override width: BoardDimensions['files'] = 11;
	
	protected constructor() {
		super(GrandAbalone.rules);
	}
	
	override clone(): GrandAbalone {
		return super.clone() as GrandAbalone;
	}
	
	static override getClass() {
		return this;
	}
	
	static override default(): GrandAbalone {
		return super.default() as GrandAbalone;
	}
	
	static override fromSetup(setup: Setup): Result<GrandAbalone, PositionError> {
		return super.fromSetup(setup).map(v => {
			if (defined(setup.lastMove)) v.play(setup.lastMove);
			return v as GrandAbalone;
		});
	}
	
	//
	//
	static override getMaxUsable(): number | undefined {
		return 4;
	}
	
	static override getWinningScore(): number {
		return 10;
	}
	
	static override hasPrevPlayer(): boolean {
		return true;
	}
}