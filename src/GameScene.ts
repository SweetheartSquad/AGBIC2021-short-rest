import { backIn, elasticOut, quadIn, quadInOut, quadOut } from 'eases';
import { Howl } from 'howler';
import {
	BitmapText,
	Container,
	Graphics,
	NineSlicePlane,
	Sprite,
	Texture,
	TilingSprite,
} from 'pixi.js';
import { getAlphaFilter } from './AlphaFilter';
import { Camera } from './Camera';
import { Camp } from './Camp';
import { Card, CardDef } from './Card';
import { CharacterPlayer } from './CharacterPlayer';
import { firePath } from './firePath';
import { filterTextOutline, fontAnnounce, fontLog } from './font';
import { game, resources } from './Game';
import { GameObject } from './GameObject';
import { Hand } from './Hand';
import { Level, LevelDef } from './Map';
import { Obstacle } from './Obstacle';
import { ScreenFilter } from './ScreenFilter';
import { Animator } from './Scripts/Animator';
import { Script } from './Scripts/Script';
import { size } from './size';
import { Tween, TweenManager } from './Tweens';
import { UIMap } from './UIMap';
import {
	andList,
	btn,
	delay,
	inputMenu,
	lerp,
	randRange,
	removeFromArray,
	shuffle,
	tex,
	toggleFullscreen,
	wrap,
} from './utils';

export class GameScene extends GameObject {
	delay = delay;

	shuffle = shuffle;

	andList = andList;

	tween = TweenManager.tween;

	toggleFullscreen = toggleFullscreen;

	debug = process.env.NODE_ENV === 'development';

	camp: Camp;

	container = new Container();

	containerUI = new Container();

	containerParty = new Container();

	containerObstacle = new Container();

	graphics = new Graphics();

	camera = new Camera();

	screenFilter: ScreenFilter;

	hand: Hand = new Hand();

	handStack: CardDef[][] = [];

	party: CharacterPlayer[] = [];

	obstacles: Obstacle[] = [];

	get front() {
		return this.party[this.party.length - 1];
	}

	get obstacle() {
		return this.obstacles[this.obstacles.length - 1] as Maybe<Obstacle>;
	}

	get enemy() {
		return !!this.obstacle?.health;
	}

	alive(name: string) {
		return this.party.some((i) => i.name === name && i.health);
	}

	map: UIMap = new UIMap();

	logs: Container[] = [];

	bg: TilingSprite;

	fg: TilingSprite;

	border: NineSlicePlane;

	animatorBg: Animator;

	animatorFg: Animator;

	deck: CardDef[] = [];

	deckAvailable: CardDef[] = [];

	areas: LevelDef[] = [];

	queue: (() => Promise<void> | void)[] = [];

	busy = false;

	position = 0;

	level = -1;

	cardSpeed = 0;

	handSize = -1;

	musicPlaying?: {
		music: string;
		howl: Howl;
		id: number;
		volume: number;
		rate: number;
	};

	constructor() {
		super();
		this.camp = new Camp();
		this.camp.display.container.visible = false;

		this.bg = new TilingSprite(
			resources.error.texture as Texture,
			size.x,
			size.y
		);
		this.fg = new TilingSprite(
			resources.error.texture as Texture,
			size.x,
			size.y
		);
		this.scripts.push(
			(this.animatorBg = new Animator(this, { spr: this.bg, freq: 1 / 800 }))
		);
		this.scripts.push(
			(this.animatorFg = new Animator(this, { spr: this.fg, freq: 1 / 800 }))
		);

		this.screenFilter = new ScreenFilter();
		this.screenFilter.uniforms.overlay = [0, 0, 0, 1];
		this.camera.display.container.filters = [this.screenFilter];

		this.camera.display.container.x -= size.x / 2;
		this.camera.display.container.y -= size.y / 2;
		this.camera.display.container.addChild(this.container);

		this.hand.addCard('init');
		this.hand.hand[0].transform.y = -size.y;
		this.playCard(this.hand.hand[0]);

		const padding = 0;
		const texBorder = resources.border.texture as Texture;
		this.border = new NineSlicePlane(
			texBorder,
			texBorder.width / 2,
			texBorder.height / 2,
			texBorder.width / 2,
			texBorder.height / 2
		);
		this.border.x = padding;
		this.border.y = padding;
		this.border.width = size.x - padding * 2;
		this.border.height = size.y - padding * 2;

		this.containerParty = new Container();
		this.containerParty.sortableChildren = true;
		this.containerParty.y += 320;

		this.containerObstacle.y += this.containerParty.y;
		this.containerObstacle.sortableChildren = true;
		this.containerObstacle.pivot.x -= size.x - 175;

		this.hand.display.container.on('play', (card) => {
			this.playCard(card);
			if (this.cardSpeed) {
				this.sfx('sfx13');
			}
		});

		const sprDeckCounter = new Sprite(tex('card_back'));
		sprDeckCounter.scale.x = sprDeckCounter.scale.y = 0.2;
		sprDeckCounter.x = 50;
		sprDeckCounter.y = size.y - 50;
		const textDeckCounter = new BitmapText('0', fontLog);
		textDeckCounter.x = 50 + sprDeckCounter.width + 5;
		textDeckCounter.y = size.y - 50;
		textDeckCounter.filters = [filterTextOutline];
		sprDeckCounter.anchor.y = textDeckCounter.anchor.y = 0.5;

		this.scripts.push({
			update: () => {
				textDeckCounter.text = `${this.deckAvailable.length}/${this.deck.length}`;
				sprDeckCounter.visible = textDeckCounter.visible = !!this.deck.length;
			},
		} as Script);

		const textLvlCounter = new BitmapText('LVL 0', fontLog);
		textLvlCounter.x = size.x / 2;
		textLvlCounter.y = 30;
		textLvlCounter.filters = [filterTextOutline];
		textLvlCounter.anchor.y = textLvlCounter.anchor.x = 0.5;

		this.scripts.push({
			update: () => {
				textLvlCounter.text = `LVL ${this.level}`;
				textLvlCounter.visible = this.level >= 1;
			},
		} as Script);

		this.containerUI.addChild(this.map.display.container);
		this.containerUI.addChild(this.camp.display.container);
		this.containerUI.addChild(this.hand.display.container);
		this.containerUI.addChild(this.border);

		this.container.addChild(this.bg);
		this.container.addChild(this.containerObstacle);
		this.container.addChild(this.containerParty);
		this.container.addChild(this.fg);
		this.container.addChild(this.containerUI);
		game.app.stage.addChild(sprDeckCounter);
		game.app.stage.addChild(textDeckCounter);
		game.app.stage.addChild(textLvlCounter);
		game.app.stage.addChild(this.hand.textDescription);
	}

	destroy(): void {
		this.container.destroy({
			children: true,
		});
		this.camera.destroy();
	}

	update(): void {
		if (!this.busy) {
			inputMenu(
				this.hand.inspecting
					? this.hand.hand.indexOf(this.hand.inspecting)
					: -1,
				this.hand.hand.map((i) => ({
					select: () => i.display.container.emit('click'),
					focus: () => i.display.container.emit('mouseover'),
				}))
			);
		}

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
			this.busy ? 30 : 0,
			0.1
		);
		this.hand.hand.forEach((i) => {
			i.display.container.alpha =
				!i.def.canPlay || i.def.canPlay(this) ? 1 : 0.8;
		});

		super.update();
		const u = this.update;
		this.update = () => {};
		GameObject.update();
		this.update = u;
		TweenManager.update();
		this.containerUI.x = this.camera.display.container.pivot.x;
		this.containerUI.y = this.camera.display.container.pivot.y;

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

		this.hand.display.container.interactiveChildren =
			// @ts-ignore
			this.hand.display.container.accessibleChildren = !this.busy;
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
				front.display.container.scale.x -= 0.3;
				front.display.container.scale.y += 0.3;
				TweenManager.abort(t1);
				if (obstacle.health > 0) {
					this.sfx('sfx1');
					obstacle.damage(front.damageOutput);
					await obstacle.def.interact?.call(obstacle, this);
				} else {
					await obstacle.def.interact?.call(obstacle, this);
				}
				if (obstacle.def.damage) front.damage(obstacle.def.damage);
			});
			return;
		}
		this.sfx('sfx4');
		this.setPosition(this.position + 1);
	}

	damageObstacle(damage: number) {
		const { obstacle } = this;
		if (!obstacle) return;
		obstacle.damage(damage);
	}

	killObstacle(target?: Obstacle) {
		const obstacle = target || this.obstacle;
		if (!obstacle) return;
		removeFromArray(this.obstacles, obstacle);
		obstacle.setHealth(0);
		const tweens: Tween[] = [];
		if (obstacle.maxHealth > 0) {
			removeFromArray(obstacle.scripts, obstacle.animator);
			this.sfx('sfx14');
			obstacle.kill();
			tweens.push(
				TweenManager.tween(
					obstacle.sprBody.scale,
					'y',
					0.8 * Math.sign(obstacle.sprBody.scale.y),
					1000,
					undefined,
					quadIn
				)
			);
			tweens.push(
				TweenManager.tween(
					obstacle.sprBody.scale,
					'x',
					1.2 * Math.sign(obstacle.sprBody.scale.x),
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
		} else {
			tweens.push(
				TweenManager.tween(obstacle.sprBody, 'x', 20, 1000, undefined, quadIn)
			);
		}
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
			await obstacle.def.end?.call(obstacle, this);
			obstacle.destroy();
		});
	}

	addCard(...options: Parameters<Hand['addCard']>) {
		const c = this.hand.addCard(...options);
		if (c.def.name !== 'Advance') {
			// keep advance on right-hand side
			const idx = this.hand.hand.findIndex((i) => i.def.name === 'Advance');
			if (idx >= 0) {
				this.hand.hand.push(this.hand.hand.splice(idx, 1)[0]);
			}
		}
		return c;
	}

	pushHand() {
		this.handStack.push(this.hand.hand.map((i) => i.def));
	}

	popHand() {
		this.clearHand();
		const hand = this.handStack.pop();
		if (hand) {
			hand.forEach((c) => {
				this.addCard(c);
			});
		}
	}

	getHand(filter = (c: Card) => c.def.variant !== 'ui') {
		return this.hand.hand.filter(filter);
	}

	choice(...choices: CardDef[]) {
		this.pushHand();
		this.clearHand();
		choices.forEach((i) => {
			this.addCard({
				...i,
				effect: () => {
					this.popHand();
					i.effect(this);
				},
			});
		});
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
		(sprCard.children[1] as BitmapText).text = (
			card.sprCard.children[1] as BitmapText
		).text;
		sprCard.anchor.x = sprCard.anchor.y = 0.5;
		sprCard.x = card.transform.x;
		sprCard.y = card.transform.y;
		this.containerUI.addChild(sprCard);
		this.hand.removeCard(card);
		const d = 500 * this.cardSpeed;
		this.queue.push(async () => {
			const tweenR = TweenManager.tween(
				sprCard,
				'rotation',
				Math.PI * 2,
				d,
				undefined,
				backIn
			);
			const tweenX = TweenManager.tween(
				sprCard,
				'x',
				size.x / 2,
				d,
				undefined,
				quadOut
			);
			const tweenY = TweenManager.tween(
				sprCard,
				'y',
				-sprCard.height,
				d,
				undefined,
				backIn
			);
			await delay(d);
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

		character.display.container.on('dead', () => {
			removeFromArray(this.party, character);
			if (character.temporary) {
				this.whiteout();
				this.log(`${character.name} perished!`);
				character.destroy();
				return;
			}
			const slot = this.party.findIndex((i) => i.health > 0);
			this.party.splice(slot >= 0 ? slot : this.party.length, 0, character);
			if (this.party.every((i) => !i.health)) {
				this.clearHand();
				this.announce('YOU DIED', 3000);
				this.music('', { fade: 100 });
				this.invert(3000);
				this.addCard('Start');
				(this.hand.hand[0].sprCard.children[1] as BitmapText).text = 'Restart';
			}
		});

		// make sure revived characters get put in front of dead ones
		character.display.container.on('revive', () => {
			if (character === this.front) return;
			const idx = this.party.indexOf(character);
			const slot = this.party.findIndex((i) => i !== character && i.health > 0);
			if (slot - 1 > idx) {
				removeFromArray(this.party, character);
				this.party.splice(slot - 1, 0, character);
			}
		});

		return character;
	}

	addObstacle(
		options: ConstructorParameters<typeof Obstacle>[0],
		start = true
	) {
		const enemy = new Obstacle(options);
		enemy.init();
		this.obstacles.push(enemy);
		this.containerObstacle.addChild(enemy.display.container);
		if (start && enemy.def.start) {
			this.queue.push(async () => enemy.def.start?.(this));
		}
		enemy.display.container.on('dead', () => {
			this.killObstacle(enemy);
		});
		return enemy;
	}

	setPosition(position: number) {
		const prev = this.position;
		this.obstacles.forEach((i) => i.destroy());
		this.obstacles.length = 0;
		this.position = position;
		this.map.setPosition(this.position);
		if (this.position <= prev) {
			this.camera.display.container.pivot.x =
				this.camera.targetPivot.x =
				this.containerParty.x =
				this.containerObstacle.x =
					size.x * this.position;
			this.party.forEach((i) => {
				i.transform.x = 0;
			});
		} else {
			this.queue.push(async () => {
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
						this.addObstacle(i, false);
					});
				await delay(500);
				this.party.forEach((i) => {
					i.transform.x = 0;
				});
				this.sfx('sfx9');
				await delay(1000);
				await Promise.all(
					this.obstacles.map((i) => i.def?.start?.call(i, this))
				);
			});
		}
	}

	setAreas(areas: GameScene['areas']) {
		this.areas = areas;
		this.map.setAreas(areas.map((i) => i.icon));
		this.bg.width = this.fg.width = size.x * areas.length;
		this.setPosition(0);
	}

	setLevel(level: number, mid?: Parameters<GameScene['transition']>[0]) {
		return this.transition(async () => {
			if (mid) await mid();
			this.level = level;
			const areas = Level.getLevel(level)(this);
			this.setAreas(areas);
			this.camp.display.container.visible = false;
			this.camp.douse();
		});
	}

	setBg(bg: string) {
		this.animatorBg.setAnimation(tex(bg).textureCacheIds[0]);
	}

	setFg(fg: string) {
		this.animatorFg.setAnimation(tex(fg).textureCacheIds[0]);
	}

	nextLevel(mid?: Parameters<GameScene['transition']>[0]) {
		return this.setLevel(this.level + 1, mid);
	}

	transition(mid: () => void | Promise<void>) {
		return new Promise<void>((r) => {
			this.queue.push(async () => {
				const sprBlack = new Sprite(Texture.WHITE);
				sprBlack.tint = 0x000000;
				sprBlack.width = size.x;
				sprBlack.height = size.y;
				const gCutout = new Graphics();
				gCutout.x = size.x / 2;
				gCutout.y = size.y / 2;
				sprBlack.mask = gCutout;
				this.containerUI.addChildAt(
					sprBlack,
					this.containerUI.children.length - 1
				);
				this.containerUI.addChildAt(
					gCutout,
					this.containerUI.children.length - 1
				);

				const drawCutout = (t: number) => {
					const [first, ...path] = firePath.map(
						([x, y]) => [x * t * size.x * 2, y * t * size.x * 2] as const
					);
					gCutout.moveTo(...first);
					path.forEach((i) => {
						gCutout.lineTo(...i);
					});
				};

				const t1 = TweenManager.tween(gCutout.scale, 'x', 1, 500, 1, (t) => {
					const tt = quadIn(t);
					gCutout.clear();
					gCutout.beginFill(0);
					drawCutout(tt);
					gCutout.endFill();
					return 1;
				});
				await delay(500);

				await mid();

				gCutout.clear();
				gCutout.beginFill(0);
				gCutout.drawRect(-size.x, -size.y, size.x * 2, size.y * 2);
				gCutout.endFill();
				TweenManager.abort(t1);
				const t2 = TweenManager.tween(gCutout.scale, 'x', 1, 1000, 1, (t) => {
					const tt = quadInOut(t);
					gCutout.clear();
					gCutout.beginFill(0);
					gCutout.drawRect(-size.x, -size.y, size.x * 2, size.y * 2);
					gCutout.beginHole();
					drawCutout(tt);
					gCutout.endHole();
					gCutout.endFill();
					return 1;
				});
				await delay(1000);
				TweenManager.abort(t2);
				gCutout.destroy();
				sprBlack.destroy();
				r();
			});
		});
	}

	async startCamp() {
		this.transition(() => {
			this.clearHand();
			this.refreshDeck();
			this.addCard('Kindle');
			this.addCard('Shuffle Cards');
			this.camp.display.container.visible = true;
			this.party.forEach((i) => {
				i.setArmour(0);
			});
			this.party
				.filter((i) => i.temporary)
				.forEach((i) => {
					i.display.container.emit('dead');
				});
			const dead = this.party.filter((i) => !i.health);
			dead.forEach((i) => {
				i.setHealth(Math.max(1, i.health));
			});
			if (dead.length > 0) {
				this.log(
					`${this.andList(
						dead.map((i) => i.name)
					)} revived by the fire with 1HP.`
				);
			}
			this.music('jingle_sad');
		});
	}

	addDeck(...options: Parameters<typeof Card['getCard']>) {
		const def = Card.getCard(...options);
		if (def.variant === 'instant') {
			this.queue.push(async () => {
				await def.effect(this);
			});
			return undefined;
		}
		this.deck.push(def);
		this.deckAvailable.push(def);
		this.deck.sort((a, b) =>
			a.name.localeCompare(b.name, undefined, {
				sensitivity: 'base',
				ignorePunctuation: true,
			})
		);
		return def;
	}

	/** updates deck available with current deck - current hand */
	refreshDeck() {
		this.deckAvailable = this.deck.slice();
		const cards = this.getHand().map((i) => i.def);
		cards.forEach((i) => {
			removeFromArray(this.deckAvailable, i);
		});
	}

	burnCard(card: Card) {
		removeFromArray(this.deck, card.def);
		removeFromArray(this.deckAvailable, card.def);
	}

	drawCard() {
		const [card] = this.shuffle(this.deckAvailable);
		if (!card) {
			this.log('Tried to draw a card, but there are none left!');
		} else {
			removeFromArray(this.deckAvailable, card);
			this.addCard(card);
		}
	}

	loot(_cards: Parameters<GameScene['addCard']>[0][], chances = Infinity) {
		if (_cards.length <= 0) return Promise.resolve();
		const cards = this.shuffle(_cards);
		return new Promise<void>((looted) => {
			this.queue.push(async () => {
				const sprs = cards.map((i, idx) => {
					const def = Card.getCard(i);
					const spr = Card.getCardSpr(def);
					const texOriginal = spr.texture;
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
					const loot = {
						spr,
						texOriginal,
						flipped: false,
						flip: () => {
							loot.flipped = true;
							TweenManager.tween(spr.scale, 'x', 0, 100, 1, quadIn);
							delay(100).then(() => {
								TweenManager.tween(spr.scale, 'x', 1, 300, 0, elasticOut);
								spr.texture = loot.texOriginal;
								spr.children.forEach((c) => {
									c.visible = true;
								});
								this.sfx('sfx4');
							});
						},
						remove: (picked: boolean) => {
							loot.remove = () => {};
							spr.interactive = false;
							const t1 = TweenManager.tween(
								spr,
								'alpha',
								0,
								500,
								undefined,
								quadIn
							);
							const t2 = TweenManager.tween(
								spr,
								'y',
								picked ? size.y * 2 : 0,
								500,
								undefined,
								picked ? quadOut : backIn
							);
							delay(500).then(() => {
								spr.destroy();
								TweenManager.abort(t1);
								TweenManager.abort(t2);
							});
						},
					};
					return loot;
				});
				let focused: typeof sprs[number] | undefined;
				const wavy = {
					gameObject: this.camera,
					update: () => {
						sprs.forEach((i, idx) => {
							if (i.spr.destroyed) return;
							i.spr.pivot.y = lerp(
								i.spr.pivot.y,
								Math.sin(game.app.ticker.lastTime / 500 + idx * 2) * 5 +
									(i === focused ? 20 : 0),
								0.1
							);
						});

						inputMenu(
							focused ? sprs.indexOf(focused) : -1,
							sprs.map((i) => ({
								select: () => i.spr.emit('click'),
								focus: () => i.spr.emit('mouseover'),
							}))
						);
					},
				};
				this.camera.scripts.push(wavy);
				await delay(500);

				sprs.forEach((i) => {
					i.spr.interactive = true;
				});
				const picked = await new Promise<number>((r) => {
					let flipped = 0;
					sprs.forEach((i, idx) => {
						i.spr.on('mouseover', () => {
							this.sfx('sfx5');
							focused = i;
						});
						i.spr.on('mouseout', () => {
							setTimeout(() => {
								if (focused === i) focused = undefined;
							});
						});
						i.spr.once('click', () => {
							if (flipped >= chances) return;
							flipped++;
							i.flip();
							if (flipped === chances) {
								sprs.forEach((spr) => {
									if (!spr.flipped) {
										spr.remove(false);
									}
								});
							}
							i.spr.once('click', () => {
								this.sfx('sfx4');
								r(idx);
							});
						});
					});
				});
				sprs.forEach((i, idx) => {
					i.remove(idx === picked);
				});
				await this.delay(250);
				this.addDeck(cards[picked]);
				removeFromArray(this.camera.scripts, wavy);
				looted();
			});
		});
	}

	async log(log: string) {
		this.sfx('sfx10');
		const textLog = new BitmapText(wrap(log, 20), fontLog);
		textLog.x = size.x - (fontLog.fontSize as number) * 20 - 40;
		textLog.y = 40;
		textLog.anchor.y = 1.0;
		textLog.alpha = 0;
		textLog.filters = [filterTextOutline, getAlphaFilter()];
		const containerLog = new Container();
		containerLog.x = 0;
		containerLog.y = 0;
		containerLog.addChild(textLog);
		if (this.logs.length) {
			const lastLog = this.logs[this.logs.length - 1];
			containerLog.addChild(lastLog);
		}
		this.logs.push(containerLog);
		game.app.stage.addChild(containerLog);
		const t1 = TweenManager.tween(textLog, 'alpha', 1, 200, undefined, quadOut);
		const t2 = TweenManager.tween(
			containerLog,
			'y',
			textLog.height + 10,
			200,
			undefined,
			quadOut
		);
		await delay(5000);
		TweenManager.abort(t1);
		const t3 = TweenManager.tween(textLog, 'alpha', 0, 200, undefined, quadIn);
		await delay(200);
		TweenManager.abort(t2);
		TweenManager.abort(t3);
		this.logs.splice(this.logs.indexOf(containerLog), 1);
		containerLog.destroy({ children: true });
	}

	async announce(announcement: string, duration = 2000) {
		this.sfx('sfx11');
		const textAnnounce = new BitmapText(wrap(announcement, 20), fontAnnounce);
		textAnnounce.anchor.x = textAnnounce.anchor.y = 0.5;
		textAnnounce.x = size.x / 2;
		textAnnounce.y = size.y / 2;
		textAnnounce.alpha = 0;
		textAnnounce.filters = [filterTextOutline, getAlphaFilter()];
		game.app.stage.addChild(textAnnounce);
		const t1 = TweenManager.tween(
			textAnnounce,
			'alpha',
			1,
			200,
			undefined,
			quadOut
		);
		textAnnounce.pivot.y = -10;
		const t2 = TweenManager.tween(
			textAnnounce.pivot,
			'y',
			0,
			400,
			undefined,
			quadOut
		);
		await this.delay(duration);
		TweenManager.abort(t1);
		TweenManager.abort(t2);
		const t3 = TweenManager.tween(
			textAnnounce,
			'alpha',
			0,
			200,
			undefined,
			quadIn
		);
		const t4 = TweenManager.tween(
			textAnnounce.pivot,
			'y',
			10,
			400,
			undefined,
			quadIn
		);
		await this.delay(200);
		TweenManager.abort(t3);
		TweenManager.abort(t4);
		textAnnounce.destroy();
	}

	async fanfare() {
		this.queue.push(async () => {
			if (!this.party.some((i) => i.health)) return;
			this.music('', { fade: 10 });
			this.sfx('sfx8');
			this.overlay([1, 1, 1, 1], 400);
			await this.delay(200);
			this.overlay([1, 1, 1, 0.5], 400);
			await this.delay(200);
			this.overlay([1, 1, 1, 0.25], 1000);
			await this.delay(200);
		});
	}

	howl(howl: string) {
		const h = resources[howl]?.data as Maybe<Howl>;
		if (!h) {
			console.warn(`Audio "${howl}" not found`);
			this.log(`Audio "${howl}" not found`);
		}
		return h;
	}

	sfx(
		sfx: string,
		{ rate = 1, volume = 1 }: { rate?: number; volume?: number } = {}
	) {
		const howl = this.howl(sfx);
		if (!howl) return undefined;
		const id = howl.play();
		howl.rate(rate, id);
		howl.volume(volume, id);
		return id;
	}

	music(
		music: string,
		{
			rate = 1,
			volume = 0.5,
			fade = 1000,
		}: { rate?: number; volume?: number; fade?: number } = {}
	) {
		const playing = this.musicPlaying;
		if (
			playing?.music === music &&
			playing.volume === volume &&
			playing.rate === rate
		)
			return undefined;
		if (playing) {
			playing.howl.fade(playing.volume, 0, fade, playing.id);
			delay(fade).then(() => {
				playing.howl.stop(playing.id);
			});
		}
		this.musicPlaying = undefined;
		if (!music) return undefined;
		const howl = this.howl(music);
		if (!howl) return undefined;
		const id = howl.play();
		howl.rate(rate, id);
		howl.loop(true, id);
		howl.fade(0, volume, fade, id);
		this.musicPlaying = {
			music,
			howl,
			id,
			volume,
			rate,
		};
		return id;
	}

	overlay(
		[r, g, b, a = 1]:
			| [number, number, number]
			| [number, number, number, number],
		duration = 200
	) {
		this.screenFilter.uniforms.overlay = [r, g, b, a];
		TweenManager.tween(
			this.screenFilter.uniforms.overlay,
			'3',
			0,
			duration,
			undefined,
			quadIn
		);
	}

	blackout(duration = 200) {
		this.overlay([0, 0, 0], duration);
	}

	whiteout(duration = 200) {
		this.overlay([1, 1, 1], duration);
	}

	invert(duration = 200) {
		TweenManager.tween(
			this.screenFilter.uniforms,
			'invert',
			0,
			duration,
			1,
			quadIn
		);
	}

	shake(intensity = 5, duration = 200) {
		TweenManager.tween(
			this.camera.display.container,
			'alpha',
			1,
			duration,
			undefined,
			(t) => {
				const tt = quadOut(1 - t);
				this.camera.display.container.pivot.y =
					this.camera.targetPivot.y + randRange(intensity, -intensity) * tt;
				this.camera.display.container.pivot.x =
					this.camera.targetPivot.x + randRange(intensity, -intensity) * tt;
				return 0;
			}
		);
	}

	kick(x = 0, y = 0) {
		this.camera.display.container.pivot.x += x;
		this.camera.display.container.pivot.y += y;
	}
}
