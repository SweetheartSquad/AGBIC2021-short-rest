import { quadIn } from 'eases';
import { getAlphaFilter } from './AlphaFilter';
import { Character } from './Character';
import { resources } from './Game';
import { GameScene } from './GameScene';
import { TweenManager } from './Tweens';
import { evalFn } from './utils';

type ObstacleDef = {
	name?: string;
	health?: number;
	armour?: number;
	damage?: number;
	sprite?: string;
	shadow?: false;
	offset?: number;
	start?: (scene: GameScene) => void | Promise<void>;
	interact?: (scene: GameScene) => void | Promise<void>;
	end?: (scene: GameScene) => void | Promise<void>;
};

export class Obstacle extends Character {
	static obstacles: Partial<Record<string, ObstacleDef>>;

	static getObstacle(def: string | ObstacleDef) {
		if (!Obstacle.obstacles) {
			Obstacle.obstacles = evalFn(resources.obstacles.data);
			Object.entries(Obstacle.obstacles).forEach(([name, obstacle]) => {
				(obstacle as ObstacleDef).name = (obstacle as ObstacleDef).name || name;
				(obstacle as ObstacleDef).sprite =
					(obstacle as ObstacleDef).sprite || name;
			});
		}
		return (
			(typeof def === 'string' ? Obstacle.obstacles[def] : def) || {
				sprite: 'error',
				start() {
					console.warn(`couldn't find obstacle "${def}"`);
				},
			}
		);
	}

	def: ObstacleDef;

	constructor(obstacle: string | ObstacleDef) {
		if (!Obstacle.obstacles) {
			// eslint-disable-next-line @typescript-eslint/no-implied-eval
			Obstacle.obstacles = Function(
				`"use strict";return ${resources.obstacles.data}`
			)();
		}
		const def = Obstacle.getObstacle(obstacle);
		super({
			spr: def.sprite || (typeof obstacle === 'string' ? obstacle : 'error'),
			maxHealth: def.health || 0,
			armour: def.armour,
		});
		this.def = def;
		this.display.container.filters = [getAlphaFilter()];
		if (def.shadow === false) {
			this.display.container.children[0].visible = false;
		}
		this.display.container.pivot.y += def.offset || 0;
	}

	kill() {
		this.filterOverlay.color = 0xff0000;
		if (this.tweenFilter) TweenManager.finish(this.tweenFilter);
		this.tweenFilter = TweenManager.tween(
			this.filterOverlay,
			'alpha',
			1,
			1000,
			0,
			quadIn
		);
	}
}
