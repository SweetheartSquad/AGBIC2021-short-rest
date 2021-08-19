import { quadIn } from 'eases';
import { Character } from './Character';
import { resources } from './Game';
import { GameScene } from './GameScene';
import { TweenManager } from './Tweens';

type ObstacleDef = {
	health?: number;
	damage?: number;
	sprite?: string;
	start?: (scene: GameScene) => void | Promise<void>;
	interact?: (scene: GameScene) => void | Promise<void>;
	end?: (scene: GameScene) => void | Promise<void>;
};

export class Obstacle extends Character {
	static obstacles: Partial<Record<string, ObstacleDef>>;

	def: ObstacleDef;

	constructor(obstacle: string) {
		if (!Obstacle.obstacles) {
			// eslint-disable-next-line @typescript-eslint/no-implied-eval
			Obstacle.obstacles = Function(
				`"use strict";return ${resources.obstacles.data}`
			)();
		}
		const def = Obstacle.obstacles[obstacle] || {
			sprite: 'error',
			start() {
				console.warn(`couldn't find obstacle "${obstacle}"`);
			},
		};
		super({
			spr: def.sprite || obstacle,
			maxHealth: def.health || 0,
		});
		this.def = def;
	}

	setHealth(h: number) {
		const oldHealth = this.health;
		super.setHealth(h);
		if (oldHealth > 0 && this.health <= 0) {
			this.filterOverlay.color = 0xff0000;
			TweenManager.tween(this.filterOverlay, 'alpha', 1, 1000, 0, quadIn);
		}
	}
}
