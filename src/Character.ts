import { ColorOverlayFilter, OutlineFilter } from 'pixi-filters';
import { Container, Sprite, Texture } from 'pixi.js';
import { game, resources } from './Game';
import { GameObject } from './GameObject';
import { Animator } from './Scripts/Animator';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';
import { Tween, TweenManager } from './Tweens';
import { clamp, tex } from './utils';

const filterOL = new OutlineFilter(2, 0xffffff, 1);
let offset = 0;

export class Character extends GameObject {
	sprOL: Sprite;

	sprBody: Sprite;

	animator: Animator;

	transform: Transform;

	display: Display;

	health!: number;

	maxHealth: number;

	armour!: number;

	hearts: Sprite[];

	armours: Sprite[] = [];

	containerHealth: Container;

	offset: number = ++offset;

	filterOverlay = new ColorOverlayFilter(0, 0);

	tweenFilter?: Tween;

	constructor({
		spr,
		health,
		maxHealth,
		armour,
	}: {
		spr: string;
		health?: number;
		maxHealth: number;
		armour?: number;
	}) {
		super();
		this.maxHealth = maxHealth;
		this.scripts.push((this.transform = new Transform(this)));
		this.scripts.push((this.display = new Display(this)));
		this.sprOL = new Sprite(tex(spr));
		this.sprOL.tint = 0x000000;
		this.sprOL.filters = [filterOL];
		this.sprBody = new Sprite(this.sprOL.texture);
		this.sprBody.filters = [this.filterOverlay];
		this.sprOL.anchor.x = this.sprBody.anchor.x = 0.5;
		this.sprOL.anchor.y = this.sprBody.anchor.y = 1;
		this.scripts.push(
			(this.animator = new Animator(this, { spr: this.sprBody }))
		);
		const shadow = new Sprite(resources.shadow.texture as Texture);
		shadow.anchor.x = shadow.anchor.y = 0.5;
		shadow.width = this.sprBody.width / 2;
		this.display.container.addChild(shadow);
		this.display.container.addChild(this.sprOL);
		this.display.container.addChild(this.sprBody);

		this.containerHealth = new Container();
		this.hearts = [];
		for (let i = 0; i < maxHealth; ++i) {
			const sprHeart = new Sprite(resources.icon_heart.texture as Texture);
			sprHeart.x += (sprHeart.width + 2) * i;
			this.containerHealth.addChild(sprHeart);
			this.hearts.push(sprHeart);
		}
		this.containerHealth.x -= Math.floor(this.containerHealth.width / 2);
		this.setHealth(health ?? maxHealth);
		this.setArmour(armour || 0);
		this.containerHealth.y = this.containerHealth.height / 2;
		this.display.container.addChild(this.containerHealth);
		this.init();
	}

	destroy() {
		super.destroy();
		if (this.tweenFilter) TweenManager.abort(this.tweenFilter);
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
		this.sprOL.texture = this.sprBody.texture;
	}

	setHealth(h: number) {
		this.health = clamp(0, h, this.maxHealth);
		this.hearts.forEach((i, idx) => {
			const filled = this.health > idx;
			i.texture = resources[filled ? 'icon_heart' : 'icon_heart_empty']
				.texture as Texture;
		});
	}

	setArmour(armour: number) {
		this.armour = armour;
		this.armours.forEach((i) => i.destroy());
		const base = this.containerHealth.width;
		this.armours = new Array(armour).fill(0).map((_, idx) => {
			const sprArmour = new Sprite(resources.icon_shield.texture as Texture);
			sprArmour.x = base + (sprArmour.width + 2) * idx;
			this.containerHealth.addChild(sprArmour);
			return sprArmour;
		});
	}

	addArmour(armour: number) {
		this.setArmour(this.armour + armour);
	}

	damage(damage: number, ignoreArmour = false) {
		if (this.health <= 0 || damage === 0) return;
		if (!ignoreArmour && this.armour > 0) {
			this.addArmour(-1);
		} else {
			this.setHealth(this.health - damage);
		}
		this.filterOverlay.color = 0xff0000;
		if (this.tweenFilter) TweenManager.finish(this.tweenFilter);
		this.tweenFilter = TweenManager.tween(
			this.filterOverlay,
			'alpha',
			0,
			200,
			1
		);
		if (this.health <= 0) {
			this.display.container.emit('dead');
		}
	}

	heal(damage: number) {
		if (damage === 0) return;
		this.setHealth(this.health + damage);
		this.filterOverlay.color = 0x00ff00;
		if (this.tweenFilter) TweenManager.finish(this.tweenFilter);
		this.tweenFilter = TweenManager.tween(
			this.filterOverlay,
			'alpha',
			0,
			200,
			1
		);
	}
}
