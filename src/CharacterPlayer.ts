import { Character } from './Character';

export class CharacterPlayer extends Character {
	update() {
		if (this.health <= 0) {
			this.sprBody.scale.y = 1;
			this.sprBody.rotation = 0;
		}
		super.update();
	}

	setHealth(h: number) {
		super.setHealth(h);
		if (this.health <= 0) {
			this.sprBody.tint = 0x000000;
		} else {
			this.sprBody.tint = 0xffffff;
		}
	}
}
