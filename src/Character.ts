import { ColorOverlayFilter, OutlineFilter } from 'pixi-filters';
import { Container, Sprite, Texture } from 'pixi.js';
import { game, resources } from './Game';
import { GameObject } from './GameObject';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';
import { TweenManager } from './Tweens';
import { clamp } from './utils';

const filterOL = new OutlineFilter(2, 0xffffff, 1);
let offset = 0;

export class Character extends GameObject {
	sprOL: Sprite;

	sprBody: Sprite;

	transform: Transform;

	display: Display;

	health!: number;

	maxHealth: number;

	hearts: Sprite[];

	offset: number = ++offset;

	filterOverlay = new ColorOverlayFilter(0, 0);

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
		this.sprOL.filters = [filterOL];
		this.sprBody = new Sprite(resources[spr].texture as Texture);
		this.sprBody.filters = [this.filterOverlay];
		this.sprOL.anchor.x = this.sprBody.anchor.x = 0.5;
		this.sprOL.anchor.y = this.sprBody.anchor.y = 1;
		const shadow = new Sprite(resources.shadow.texture as Texture);
		shadow.anchor.x = shadow.anchor.y = 0.5;
		shadow.width = this.sprBody.width / 2;
		this.display.container.addChild(shadow);
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
		containerHealth.y = containerHealth.height / 2;
		this.display.container.addChild(containerHealth);
		this.init();
	}

	update() {
		super.update();
		if (this.health > 0) {
			const t = this.offset + game.app.ticker.lastTime / 100;
			this.sprOL.scale.y = this.sprBody.scale.y = 1.0 + Math.sin(t) * 0.04;
			this.sprOL.rotation = this.sprBody.rotation = Math.sin(t) * 0.03;
		}
		this.sprOL.x = this.sprBody.x - 2;
		this.sprOL.y = this.sprBody.y;
		this.sprOL.scale.y = this.sprBody.scale.y;
		this.sprOL.scale.x = this.sprBody.scale.x;
		this.sprOL.rotation = this.sprBody.rotation;
	}

	setHealth(h: number) {
		this.health = clamp(0, h, this.maxHealth);
		this.hearts.forEach((i, idx) => {
			const filled = this.health > idx;
			i.texture = resources[filled ? 'icon_heart' : 'icon_heart_empty']
				.texture as Texture;
		});
	}

	damage(damage: number) {
		this.setHealth(this.health - damage);
		this.filterOverlay.color = 0xff0000;
		TweenManager.tween(this.filterOverlay, 'alpha', 0, 200, 1);
	}

	heal(damage: number) {
		this.setHealth(this.health + damage);
		this.filterOverlay.color = 0x00ff00;
		TweenManager.tween(this.filterOverlay, 'alpha', 0, 200, 1);
	}
}
