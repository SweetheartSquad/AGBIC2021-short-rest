import { Character } from './Character';

export class CharacterPlayer extends Character {
	name: string;

	temporary: boolean;

	damageOutput: number;

	constructor({
		name,
		damage = 1,
		temporary = false,
		...options
	}: ConstructorParameters<typeof Character>[0] & {
		name: string;
		damage?: number;
		temporary?: boolean;
	}) {
		super(options);
		this.name = name;
		this.temporary = temporary;
		this.damageOutput = damage;
	}

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

	damage(damage: number, ignoreArmour = false) {
		if (damage === 0) return;
		if (this.health <= 0) {
			this.display.container.emit('dead');
			return;
		}
		super.damage(damage, ignoreArmour);
	}
}
