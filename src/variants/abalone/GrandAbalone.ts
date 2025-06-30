import {Result} from '@badrap/result';
import {IllegalSetup, PositionError} from '../../chess';
import type {Setup} from '../../setup';
import {type BoardDimensions, type Rules} from '../../types';
import {defined} from '../../util.js';
import {GameFamily} from './GameFamily';

export class GrandAbalone extends GameFamily {
	static override height: BoardDimensions['ranks'] = 11;
	static override width: BoardDimensions['files'] = 11;
	static override rules: Rules = 'grandabalone';
	
	static override default(): GrandAbalone {
		const pos = super.default();
		return pos as GrandAbalone;
	}
	
	static override fromSetup(setup: Setup): Result<GrandAbalone, PositionError> {
		return super.fromSetup(setup).map(v => {
			if (defined(setup.lastMove)) v.play(setup.lastMove);
			return v as GrandAbalone;
		});
	}
	
	static override getClass() {
		return this;
	}
	
	override clone(): GrandAbalone {
		return super.clone() as GrandAbalone;
	}
	
	protected constructor() {
		super('grandabalone');
	}
	
	protected override validate(): Result<undefined, PositionError> {
		if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
		
		return Result.ok(undefined);
	}
}