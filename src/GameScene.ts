import { backIn, elasticOut, quadIn, quadInOut, quadOut } from 'eases';
import {
	Container,
	Graphics,
	NineSlicePlane,
	Texture,
	TilingSprite,
} from 'pixi.js';
import { getAlphaFilter } from './AlphaFilter';
import { Camera } from './Camera';
import { Camp } from './Camp';
import { Card, CardDef } from './Card';
import { Character } from './Character';
import { CharacterPlayer } from './CharacterPlayer';
import { game, resources } from './Game';
import { GameObject } from './GameObject';
import { Hand } from './Hand';
import { Level, LevelDef } from './Map';
import { Obstacle } from './Obstacle';
import { ScreenFilter } from './ScreenFilter';
import { size } from './size';
import { Tween, TweenManager } from './Tweens';
import { UIMap } from './UIMap';
import { btn, delay, lerp, randRange, removeFromArray, shuffle } from './utils';

export class GameScene {
	delay = delay;

	shuffle = shuffle;

	camp: Camp;

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

	deck: CardDef[] = [];

	areas: LevelDef[] = [];

	queue: (() => Promise<void> | void)[] = [];

	busy = false;

	position = 0;

	level = 0;

	constructor() {
		this.camp = new Camp();
		this.camp.display.container.visible = false;

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

		this.containerParty = new Container();
		this.containerParty.sortableChildren = true;
		this.containerParty.y += 320;

		this.containerObstacle.y += this.containerParty.y;
		this.containerObstacle.pivot.x -= size.x - 175;

		this.hand.display.container.on('play', (card) => {
			this.playCard(card);
		});

		this.containerUI.addChild(this.map.display.container);
		this.containerUI.addChild(this.camp.display.container);
		this.containerUI.addChild(this.hand.display.container);
		this.containerUI.addChild(border);

		this.container.addChild(this.bg);
		this.container.addChild(this.containerObstacle);
		this.container.addChild(this.containerParty);
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
		overlap = (1 / this.obstacles.length) * 0.7;
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
		this.hand.hand.forEach((i) => {
			i.display.container.alpha =
				!i.def.canPlay || i.def.canPlay(this) ? 1 : 0.8;
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

		this.hand.display.container.interactiveChildren = !this.busy;
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
					if (!this.front.health) {
						// TODO: lose state + restart
						this.clearHand();
						this.addCard({ name: 'you died', effect() {} });
					}
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
			const area = this.areas[this.position];
			area?.obstacles
				?.slice()
				.reverse()
				.forEach((i) => {
					this.addObstacle(i);
				});
			await delay(500);
			this.party.forEach((i) => {
				i.transform.x = 0;
			});
			await delay(1000);
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

	addCard(...options: Parameters<Hand['addCard']>) {
		return this.hand.addCard(...options);
	}

	clearParty() {
		this.party.forEach((i) => {
			i.destroy();
		});
		this.party.length = 0;
	}

	clearHand() {
		while (this.hand.hand.length) {
			this.hand.removeCard(this.hand.hand[this.hand.hand.length - 1]);
		}
	}

	playCard(card: Card) {
		const { def } = card;
		if (def.canPlay && !def.canPlay(this)) return;
		const sprCard = Card.getCardSpr(def);
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

	setAreas(areas: GameScene['areas']) {
		this.obstacles.forEach((i) => i.destroy());
		this.obstacles.length = 0;
		this.areas = areas;
		this.map.setAreas(areas.map((i) => i.icon));
		this.position = 0;
		this.map.setPosition(this.position);
		this.bg.width = this.fg.width = size.x * areas.length;

		this.camera.display.container.pivot.x =
			this.camera.targetPivot.x =
			this.containerParty.x =
			this.containerObstacle.x =
				size.x * this.position;
		this.party.forEach((i) => {
			i.transform.x = 0;
		});
	}

	setLevel(level: number) {
		this.level = level;
		const areas = Level.getLevel(level)(this);
		this.setAreas(areas);
	}

	nextLevel() {
		this.setLevel(this.level + 1);
	}

	startCamp() {
		this.camp.display.container.visible = true;
		this.clearHand();
		this.addCard('Kindle');
		this.addCard('Continue');
	}

	addDeck(...options: Parameters<typeof Card['getCard']>) {
		const def = Card.getCard(...options);
		this.deck.push(def);
		this.deck.sort((a, b) =>
			a.name.localeCompare(b.name, undefined, {
				sensitivity: 'base',
				ignorePunctuation: true,
			})
		);
		return def;
	}

	loot(cards: Parameters<GameScene['addCard']>[0][]) {
		if (cards.length <= 0) return;
		this.queue.push(async () => {
			const sprs = cards.map((i, idx) => {
				const def = Card.getCard(i);
				const spr = Card.getCardSpr(def);
				spr.texture = resources.card_back.texture as Texture;
				spr.children.forEach((c) => {
					c.visible = false;
				});
				spr.anchor.x = spr.anchor.y = 0.5;
				this.containerUI.addChild(spr);
				spr.x = size.x / 2;
				spr.y = size.y / 2;
				spr.alpha = 0;
				spr.filters = [getAlphaFilter()];
				btn(spr, def.name, def.description);
				TweenManager.tween(
					spr,
					'x',
					size.x / 2 +
						(cards.length > 1
							? (idx / (cards.length - 1) - 0.5) * 2 * spr.width
							: 0),
					500,
					undefined,
					quadOut
				);
				TweenManager.tween(spr, 'y', size.y / 2, 500, undefined, quadOut);
				TweenManager.tween(spr, 'alpha', 1, 200, undefined, quadOut);
				spr.interactive = false;
				return spr;
			});
			const wavy = {
				gameObject: this.camera,
				update: () => {
					sprs.forEach((i, idx) => {
						i.pivot.y = Math.sin(game.app.ticker.lastTime / 500 + idx * 2) * 5;
					});
				},
			};
			this.camera.scripts.push(wavy);
			await delay(500);

			sprs.forEach((i) => {
				i.interactive = true;
			});
			const picked = await new Promise<number>((r) => {
				sprs.forEach((i, idx) => {
					i.once('click', () => {
						TweenManager.tween(i.scale, 'x', 0, 100, 1, quadIn);
						delay(100).then(() => {
							TweenManager.tween(i.scale, 'x', 1, 300, 0, elasticOut);
							i.texture = resources.card.texture as Texture;
							i.children.forEach((c) => {
								c.visible = true;
							});
							i.once('click', () => {
								r(idx);
							});
						});
					});
				});
			});
			removeFromArray(this.camera.scripts, wavy);
			this.addDeck(cards[picked]);
			sprs.forEach((i, idx) => {
				i.interactive = false;
				const t1 = TweenManager.tween(i, 'alpha', 0, 500, undefined, quadIn);
				const t2 = TweenManager.tween(
					i,
					'y',
					idx === picked ? size.y * 2 : 0,
					500,
					undefined,
					idx === picked ? quadOut : backIn
				);
				delay(500).then(() => {
					i.destroy();
					TweenManager.abort(t1);
					TweenManager.abort(t2);
				});
			});
		});
	}
}
