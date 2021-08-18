import { backIn, quadIn, quadInOut, quadOut } from 'eases';
import {
	Container,
	Graphics,
	NineSlicePlane,
	Sprite,
	Text,
	Texture,
	TilingSprite,
} from 'pixi.js';
import { Camera } from './Camera';
import { Card } from './Card';
import { Character } from './Character';
import { CharacterEnemy } from './CharacterEnemy';
import { CharacterPlayer } from './CharacterPlayer';
import { fontTitle } from './font';
import { game, resources } from './Game';
import { GameObject } from './GameObject';
import { Hand } from './Hand';
import { ScreenFilter } from './ScreenFilter';
import { size } from './size';
import { Tween, TweenManager } from './Tweens';
import { UIMap } from './UIMap';
import { btn, delay, lerp, randRange, removeFromArray } from './utils';

export class GameScene {
	container = new Container();

	containerUI = new Container();

	containerParty = new Container();

	containerFacing = new Container();

	graphics = new Graphics();

	camera = new Camera();

	screenFilter: ScreenFilter;

	hand: Hand = new Hand();

	// hand: Card[] = [];
	party: Character[] = [];

	facing?: Character;

	map: UIMap = new UIMap();

	bg: TilingSprite;

	fg: TilingSprite;

	queue: (() => Promise<void> | void)[] = [];

	busy = false;

	position = 0;

	constructor() {
		this.bg = new TilingSprite(resources.bg.texture as Texture, size.x, size.y);
		this.fg = new TilingSprite(resources.fg.texture as Texture, size.x, size.y);

		this.screenFilter = new ScreenFilter();
		this.camera.display.container.filters = [this.screenFilter];

		this.camera.display.container.x -= size.x / 2;
		this.camera.display.container.y -= size.y / 2;
		this.camera.display.container.addChild(this.container);

		this.hand.addCard('refresh');

		const padding = 0;
		const texBorder = resources.border.texture as Texture;
		const border = new NineSlicePlane(
			texBorder,
			texBorder.width / 2,
			texBorder.height / 2,
			texBorder.width / 2,
			texBorder.height / 2
		);
		border.x = padding;
		border.y = padding;
		border.width = size.x - padding * 2;
		border.height = size.y - padding * 2;

		const textTitle = new Text('SHORT REST', fontTitle);
		textTitle.y = size.y - 70;
		textTitle.x = 30;
		game.app.stage.addChild(textTitle);

		const partyDef = [
			{ spr: 'frog', maxHealth: 2 },
			{ spr: 'cat', maxHealth: 3 },
			{ spr: 'apple', maxHealth: 2 },
			{ spr: 'onion', maxHealth: 4 },
		];
		this.containerParty = new Container();
		this.containerParty.sortableChildren = true;
		this.containerParty.y += 320;
		partyDef.forEach((i) => {
			const character = new CharacterPlayer(i);
			this.containerParty.addChild(character.display.container);
			this.party.push(character);
		});
		this.party[3].setHealth(2);

		this.containerFacing.y += this.containerParty.y;
		this.containerFacing.pivot.x -= size.x - 150;

		this.setAreas([
			'camp',
			'enemy',
			'enemy',
			'treasure',
			'unknown',
			'attention',
			'enemy',
			'treasure',
			'door',
		]);

		const sprAdvance = new Sprite(resources.advance.texture as Texture);
		btn(sprAdvance, 'advance');
		sprAdvance.on('click', () => {
			this.advance();
		});
		let tweenAdvance: Tween;
		sprAdvance.on('pointerover', () => {
			if (tweenAdvance) TweenManager.abort(tweenAdvance);
			tweenAdvance = TweenManager.tween(sprAdvance, 'alpha', 0.8, 100);
		});
		sprAdvance.on('pointerout', () => {
			if (tweenAdvance) TweenManager.abort(tweenAdvance);
			tweenAdvance = TweenManager.tween(sprAdvance, 'alpha', 1.0, 100);
		});
		sprAdvance.anchor.x = sprAdvance.anchor.y = 0.5;
		sprAdvance.x = size.x / 2;
		sprAdvance.y = 80;

		this.hand.display.container.on('play', (card) => {
			this.playCard(card);
		});

		this.containerUI.addChild(this.map.display.container);
		this.containerUI.addChild(sprAdvance);
		this.containerUI.addChild(this.hand.display.container);
		this.containerUI.addChild(border);

		this.container.addChild(this.bg);
		this.container.addChild(this.containerParty);
		this.container.addChild(this.containerFacing);
		this.container.addChild(this.fg);
		this.container.addChild(this.containerUI);
	}

	destroy(): void {
		this.container.destroy({
			children: true,
		});
		this.camera.destroy();
	}

	update(): void {
		const curTime = game.app.ticker.lastTime;
		this.screenFilter.uniforms.curTime = curTime;
		this.screenFilter.uniforms.camPos = [
			this.camera.display.container.pivot.x,
			-this.camera.display.container.pivot.y,
		];

		const overlap = 0.5;
		this.party.forEach((i, idx) => {
			const prev = this.party[idx - 1];
			i.transform.x = lerp(
				i.transform.x,
				prev
					? prev.transform.x +
							(prev.display.container.width / 2 +
								i.display.container.width / 2) *
								overlap
					: 120,
				0.1
			);
			i.transform.y = lerp(
				i.transform.y,
				idx === this.party.length - 1 ? 0 : -20,
				0.1
			);
			i.display.container.scale.y = lerp(
				i.display.container.scale.y,
				idx === this.party.length - 1 ? 1 : 0.8,
				0.1
			);
			i.display.container.scale.x = i.display.container.scale.y;
			i.display.container.zIndex = idx;
		});

		this.screenFilter.update();

		GameObject.update();
		TweenManager.update();
		this.containerUI.x = this.camera.display.container.pivot.x;

		if (!this.busy && this.queue.length) {
			this.busy = true;
			const next = this.queue.shift();
			const p = (next as NonNullable<typeof next>)();
			if (p) {
				p.then(() => {
					this.busy = false;
				});
			}
		}

		this.containerUI.interactiveChildren = !this.busy;
	}

	advance() {
		const { facing } = this;
		if (facing) {
			if (facing.health > 0) {
				this.queue.push(async () => {
					const front = this.party[this.party.length - 1];
					front.display.container.scale.x += 0.3;
					front.display.container.scale.y -= 0.3;
					const t1 = TweenManager.tween(
						front.transform,
						'x',
						size.x * 0.66,
						100,
						undefined,
						quadOut
					);
					await delay(100);
					front.display.container.scale.x -= 0.3;
					front.display.container.scale.y += 0.3;
					TweenManager.abort(t1);
					facing.damage(1);
					front.damage(1);
					if (front.health <= 0) {
						removeFromArray(this.party, front);
						this.party.unshift(front);
					}
					if (facing.health <= 0) {
						this.killFacing();
					}
				});
				return;
			}
		}
		this.queue.push(() => {
			this.position += 1;
			this.map.setPosition(this.position);
			TweenManager.tween(
				this.camera.targetPivot,
				'x',
				size.x * this.position,
				500,
				undefined,
				quadOut
			);
			TweenManager.tween(
				this.containerParty,
				'x',
				size.x * this.position,
				1500,
				undefined,
				quadInOut
			);
			this.containerFacing.x = size.x * this.position;
			if (this.map.areas[this.position] === 'enemy') {
				const enemy = new CharacterEnemy({ spr: 'skeleton', maxHealth: 5 });
				enemy.init();
				this.facing = enemy;
				this.containerFacing.addChild(enemy.display.container);
			}
			return delay(1500);
		});
	}

	damageFacing(damage: number) {
		if (!this.facing) return;
		this.facing.damage(damage);
		if (this.facing.health <= 0) {
			this.killFacing();
		}
	}

	killFacing() {
		const { facing } = this;
		if (!facing) return;
		this.facing = undefined;
		facing.setHealth(0);
		const tweens: Tween[] = [];
		tweens.push(
			TweenManager.tween(
				facing.sprBody.scale,
				'y',
				0.8,
				1000,
				undefined,
				quadIn
			)
		);
		tweens.push(
			TweenManager.tween(
				facing.sprBody.scale,
				'x',
				1.2,
				1000,
				undefined,
				quadIn
			)
		);
		tweens.push(
			TweenManager.tween(facing.sprBody, 'x', 50, 1000, undefined, (t) =>
				randRange(-t, t)
			)
		);
		tweens.push(
			TweenManager.tween(facing.sprBody, 'y', 50, 1000, undefined, (t) =>
				randRange(-t, t)
			)
		);
		tweens.push(
			TweenManager.tween(
				facing.display.container,
				'alpha',
				0,
				1000,
				undefined,
				quadIn
			)
		);
		this.queue.push(async () => {
			await delay(1000);
			tweens.forEach((i) => TweenManager.abort(i));
			facing.destroy();
		});
	}

	addCard(card: string) {
		this.hand.addCard(card);
	}

	playCard(card: Card) {
		const {
			def,
			sprCard: { texture },
		} = card;
		if (def.canPlay && !def.canPlay(this)) return;
		this.hand.removeCard(card);
		const sprCard = new Sprite(texture);
		sprCard.anchor.x = sprCard.anchor.y = 0.5;
		sprCard.x = card.transform.x;
		sprCard.y = card.transform.y;
		this.containerUI.addChild(sprCard);
		card.destroy();
		this.queue.push(async () => {
			const tweenR = TweenManager.tween(
				sprCard,
				'rotation',
				Math.PI * 2,
				500,
				undefined,
				backIn
			);
			const tweenX = TweenManager.tween(
				sprCard,
				'x',
				size.x / 2,
				500,
				undefined,
				quadOut
			);
			const tweenY = TweenManager.tween(
				sprCard,
				'y',
				0,
				500,
				undefined,
				backIn
			);
			await delay(500);
			TweenManager.abort(tweenR);
			TweenManager.abort(tweenY);
			TweenManager.abort(tweenX);
			def.effect(this);
			sprCard.destroy();
		});
	}

	setAreas(areas: string[]) {
		this.map.setAreas(areas);
		this.map.setPosition(0);
		this.bg.width = this.fg.width = size.x * areas.length;
	}
}
