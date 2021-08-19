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
import { CharacterPlayer } from './CharacterPlayer';
import { fontTitle } from './font';
import { game, resources } from './Game';
import { GameObject } from './GameObject';
import { Hand } from './Hand';
import { Obstacle } from './Obstacle';
import { ScreenFilter } from './ScreenFilter';
import { size } from './size';
import { Tween, TweenManager } from './Tweens';
import { UIMap } from './UIMap';
import { delay, lerp, randRange, removeFromArray } from './utils';

export class GameScene {
	delay = delay;

	container = new Container();

	containerUI = new Container();

	containerParty = new Container();

	containerObstacle = new Container();

	graphics = new Graphics();

	camera = new Camera();

	screenFilter: ScreenFilter;

	hand: Hand = new Hand();

	party: Character[] = [];

	obstacles: Obstacle[] = [];

	get front() {
		return this.party[this.party.length - 1];
	}

	get obstacle() {
		return this.obstacles[this.obstacles.length - 1];
	}

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

		this.hand.addCard('init');
		this.hand.hand[0].transform.y = -size.y;
		this.playCard(this.hand.hand[0]);

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

		this.containerParty = new Container();
		this.containerParty.sortableChildren = true;
		this.containerParty.y += 320;

		this.containerObstacle.y += this.containerParty.y;
		this.containerObstacle.pivot.x -= size.x - 175;

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

		this.hand.display.container.on('play', (card) => {
			this.playCard(card);
		});

		this.containerUI.addChild(this.map.display.container);
		this.containerUI.addChild(this.hand.display.container);
		this.containerUI.addChild(border);

		this.container.addChild(this.bg);
		this.container.addChild(this.containerParty);
		this.container.addChild(this.containerObstacle);
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

		let overlap = 2 / this.party.length;
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
		overlap = 1 / this.obstacles.length;
		this.obstacles.forEach((i, idx) => {
			const prev = this.obstacles[idx - 1];
			i.transform.x = lerp(
				i.transform.x,
				prev
					? prev.transform.x -
							(prev.display.container.width / 2 +
								i.display.container.width / 2) *
								overlap
					: 0,
				0.1
			);
			i.transform.y = lerp(
				i.transform.y,
				idx === this.obstacles.length - 1 ? 0 : -20,
				0.1
			);
			i.display.container.scale.y = lerp(
				i.display.container.scale.y,
				idx === this.obstacles.length - 1 ? 1 : 0.8,
				0.1
			);
			i.display.container.scale.x = i.display.container.scale.y;
			i.display.container.zIndex = idx;
		});

		this.hand.display.container.y = lerp(
			this.hand.display.container.y,
			this.busy ? 50 : 0,
			0.1
		);

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
		const { obstacle } = this;
		if (obstacle) {
			this.queue.push(async () => {
				const { front } = this;
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
				await obstacle.def.interact?.(this);
				front.display.container.scale.x -= 0.3;
				front.display.container.scale.y += 0.3;
				TweenManager.abort(t1);
				if (obstacle.def.damage) front.damage(obstacle.def.damage);
				if (front.health <= 0) {
					removeFromArray(this.party, front);
					this.party.splice(
						this.party.findIndex((i) => i.health > 0),
						0,
						front
					);
				}
				if (obstacle.health > 0) {
					obstacle.damage(1);
					if (obstacle.health <= 0) {
						this.killObstacle();
					}
				}
			});
			return;
		}
		this.queue.push(async () => {
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
			this.containerObstacle.x = size.x * this.position;
			const area = this.map.areas[this.position];
			if (area === 'enemy') {
				this.addObstacle(Math.random() > 0.5 ? 'skeleton' : 'bat');
			} else if (area === 'treasure') {
				this.addObstacle('treasure');
			} else if (area === 'door') {
				this.addObstacle('door');
			}
			await delay(1500);
			await Promise.all(this.obstacles.map((i) => i.def?.start?.(this)));
		});
	}

	damageObstacle(damage: number) {
		const { obstacle } = this;
		if (!obstacle) return;
		obstacle.damage(damage);
		if (obstacle.health <= 0) {
			this.killObstacle();
		}
	}

	killObstacle() {
		const { obstacle } = this;
		if (!obstacle) return;
		removeFromArray(this.obstacles, obstacle);
		obstacle.setHealth(0);
		removeFromArray(obstacle.scripts, obstacle.animator);
		const tweens: Tween[] = [];
		tweens.push(
			TweenManager.tween(
				obstacle.sprBody.scale,
				'y',
				0.8,
				1000,
				undefined,
				quadIn
			)
		);
		tweens.push(
			TweenManager.tween(
				obstacle.sprBody.scale,
				'x',
				1.2,
				1000,
				undefined,
				quadIn
			)
		);
		tweens.push(
			TweenManager.tween(obstacle.sprBody, 'x', 50, 1000, undefined, (t) =>
				randRange(-t, t)
			)
		);
		tweens.push(
			TweenManager.tween(obstacle.sprBody, 'y', 50, 1000, undefined, (t) =>
				randRange(-t, t)
			)
		);
		tweens.push(
			TweenManager.tween(
				obstacle.display.container,
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
			await obstacle.def.end?.(this);
			obstacle.destroy();
		});
	}

	addCard(card: string) {
		this.hand.addCard(card);
	}

	clearHand() {
		while (this.hand.hand.length) {
			this.hand.removeCard(this.hand.hand[this.hand.hand.length - 1]);
		}
	}

	playCard(card: Card) {
		const {
			def,
			sprCard: { texture },
		} = card;
		if (def.canPlay && !def.canPlay(this)) return;
		const sprCard = new Sprite(texture);
		sprCard.anchor.x = sprCard.anchor.y = 0.5;
		sprCard.x = card.transform.x;
		sprCard.y = card.transform.y;
		this.containerUI.addChild(sprCard);
		this.hand.removeCard(card);
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
				-sprCard.height,
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

	addParty(...options: ConstructorParameters<typeof CharacterPlayer>) {
		const character = new CharacterPlayer(...options);
		this.containerParty.addChild(character.display.container);
		this.party.push(character);
		return character;
	}

	addObstacle(...options: ConstructorParameters<typeof Obstacle>) {
		const enemy = new Obstacle(...options);
		enemy.init();
		this.obstacles.push(enemy);
		this.containerObstacle.addChild(enemy.display.container);
		return enemy;
	}

	setAreas(areas: string[]) {
		this.map.setAreas(areas);
		this.map.setPosition(0);
		this.bg.width = this.fg.width = size.x * areas.length;
	}
}
