import { resources } from './Game';
import { GameScene } from './GameScene';
import { evalFn } from './utils';

export type LevelDef = {
	icon: string;
	obstacles?: Parameters<GameScene['addObstacle']>[0][];
};

export class Level {
	static levels: Partial<Record<number, (scene: GameScene) => LevelDef[]>>;

	static getLevel(def: number) {
		if (!Level.levels) {
			Level.levels = evalFn(resources.levels.data);
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
