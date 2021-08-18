import { quadIn } from 'eases';
import { Character } from './Character';
import { TweenManager } from './Tweens';

export class CharacterEnemy extends Character {
	setHealth(h: number) {
		const oldHealth = this.health;
		super.setHealth(h);
		if (oldHealth > 0 && this.health <= 0) {
			this.filterOverlay.color = 0xff0000;
			TweenManager.tween(this.filterOverlay, 'alpha', 1, 1000, 0, quadIn);
		}
	}
}
