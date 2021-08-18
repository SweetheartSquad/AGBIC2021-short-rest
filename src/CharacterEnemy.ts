import { quadIn } from 'eases';
import { ColorOverlayFilter } from 'pixi-filters';
import { Character } from './Character';
import { TweenManager } from './Tweens';

const filterDead = new ColorOverlayFilter(0xff0000);

export class CharacterEnemy extends Character {
	setHealth(h: number) {
		super.setHealth(h);
		if (this.health <= 0) {
			this.display.container.filters = [filterDead];
			TweenManager.tween(filterDead, 'alpha', 1, 1000, 0, quadIn);
		}
	}
}
