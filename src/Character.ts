import { OutlineFilter } from 'pixi-filters';
import { Container, Sprite, Texture } from 'pixi.js';
import { resources } from './Game';
import { GameObject } from './GameObject';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';

const filterOL = new OutlineFilter(2, 0xffffff, 0);

export class Character extends GameObject {
	sprOL: Sprite;

	sprBody: Sprite;

	transform: Transform;

	display: Display;

	health!: number;

	maxHealth: number;

	hearts: Sprite[];

	constructor({
		spr,
		health,
		maxHealth,
	}: {
		spr: string;
		health?: number;
		maxHealth: number;
	}) {
		super();
		this.maxHealth = maxHealth;
		this.scripts.push((this.transform = new Transform(this)));
		this.scripts.push((this.display = new Display(this)));
		this.sprOL = new Sprite(resources[spr].texture as Texture);
		this.sprOL.tint = 0x000000;
		this.sprOL.x += -2;
		this.sprOL.filters = [filterOL];
		this.sprBody = new Sprite(resources[spr].texture as Texture);
		this.sprOL.anchor.x = this.sprBody.anchor.x = 0.5;
		this.display.container.addChild(this.sprOL);
		this.display.container.addChild(this.sprBody);

		const containerHealth = new Container();
		this.hearts = [];
		for (let i = 0; i < maxHealth; ++i) {
			const sprHeart = new Sprite(resources.icon_heart.texture as Texture);
			sprHeart.x += (sprHeart.width + 2) * i;
			containerHealth.addChild(sprHeart);
			this.hearts.push(sprHeart);
		}
		containerHealth.x -= Math.floor(containerHealth.width / 2);
		this.setHealth(health ?? maxHealth);
		containerHealth.y = this.display.container.height;
		this.display.container.addChild(containerHealth);
	}

	setHealth(h: number) {
		this.health = Math.min(this.maxHealth, h);
		this.hearts.forEach((i, idx) => {
			const filled = this.health > idx;
			i.texture = resources[filled ? 'icon_heart' : 'icon_heart_empty']
				.texture as Texture;
		});
	}
}
