import { resources } from './Game';
import { GameScene } from './GameScene';

export type LevelDef = {
	icon: string;
	obstacles?: Parameters<GameScene['addObstacle']>[0][];
};

export class Level {
	static levels: Partial<Record<number, (scene: GameScene) => LevelDef[]>>;

	static getLevel(def: number) {
		if (!Level.levels) {
			// eslint-disable-next-line @typescript-eslint/no-implied-eval
			Level.levels = Function(`"use strict";return ${resources.levels.data}`)();
		}
		return (
			Level.levels[def] ||
			(() => [
				{
					icon: 'error',
					obstacles: [{ sprite: 'error' }],
				},
			])
		);
	}
}
