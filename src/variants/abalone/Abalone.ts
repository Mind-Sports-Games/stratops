import {type Result} from '@badrap/result';
import {type PositionError} from '../../chess';
import type {Setup} from '../../setup';
import {type BoardDimensions, type Rules} from '../../types';
import {defined} from '../../util.js';
import {GameFamily} from './GameFamily';
import {type Variant} from "../Variant";

export class Abalone extends GameFamily {
	static override rules: Rules = 'abalone';
	
	protected constructor() {
		super(Abalone.rules);
	}
	
	override clone(): Abalone {
		return super.clone() as Abalone;
	}
	
	static override getClass() {
		return this;
	}
	
	static override default(): Abalone {
		const pos = super.default();
		return pos as Abalone;
	}
	
	static override fromSetup(setup: Setup): Result<Abalone, PositionError> {
		return super.fromSetup(setup).map(v => {
			if (defined(setup.lastMove)) v.play(setup.lastMove);
			return v as Abalone;
		});
	}
}