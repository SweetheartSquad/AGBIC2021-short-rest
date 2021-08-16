import { quadInOut, quadOut } from 'eases';
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
import { Character } from './Character';
import { fontTitle } from './font';
import { game, resources } from './Game';
import { GameObject } from './GameObject';
import { Hand } from './Hand';
import { ScreenFilter } from './ScreenFilter';
import { size } from './size';
import { Tween, TweenManager } from './Tweens';
import { UIMap } from './UIMap';
import { btn, delay } from './utils';

export class GameScene {
	container = new Container();

	containerUI = new Container();

	containerParty = new Container();

	graphics = new Graphics();

	camera = new Camera();

	screenFilter: ScreenFilter;

	hand: Hand = new Hand();
	// hand: Card[] = [];

	map: UIMap = new UIMap();

	bg: TilingSprite;

	queue: (() => Promise<void> | void)[] = [];

	busy = false;

	position = 0;

	constructor() {
		this.bg = new TilingSprite(resources.bg.texture as Texture, size.x, size.y);
		this.container.addChild(this.bg);

		this.screenFilter = new ScreenFilter();
		this.camera.display.container.filters = [this.screenFilter];

		this.camera.display.container.x -= size.x / 2;
		this.camera.display.container.y -= size.y / 2;
		this.camera.display.container.addChild(this.container);

		this.hand.addCard({ name: 'test1', body: 'test 1 description' });
		this.hand.addCard({ name: 'test2', body: 'test 2 description' });
		this.hand.addCard({ name: 'test3', body: 'test 3 description' });
		this.hand.addCard({ name: 'test4', body: 'test 4 description' });
		this.hand.addCard({ name: 'test5', body: 'test 5 description' });

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
		this.containerParty.y += 320;
		const party: Character[] = [];
		const overlap = 0.6;
		partyDef.forEach((i, idx) => {
			const character = new Character(i);
			const prev = party[idx - 1];
			character.init();
			character.transform.x = prev
				? prev.transform.x +
				  (prev.display.container.width / 2 +
						character.display.container.width / 2) *
						overlap
				: 75;
			this.containerParty.addChild(character.display.container);
			party.push(character);
		});
		party[3].setHealth(2);

		const containerEnemies = new Container();
		containerEnemies.y += 320;
		containerEnemies.x = size.x - 150;
		const enemy = new Character({ spr: 'skeleton', maxHealth: 2 });
		enemy.init();
		containerEnemies.addChild(enemy.display.container);

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

		this.containerUI.addChild(this.map.display.container);
		this.containerUI.addChild(sprAdvance);
		this.containerUI.addChild(this.hand.display.container);
		this.containerUI.addChild(border);

		this.container.addChild(this.containerParty);
		this.container.addChild(containerEnemies);
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

		this.screenFilter.update();

		GameObject.update();
		TweenManager.update();
		this.containerUI.x = this.camera.display.container.pivot.x;
	}

	advance() {
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
			return delay(1500);
		});
	}

	setAreas(areas: string[]) {
		this.map.setAreas(areas);
		this.map.setPosition(0);
		this.bg.width = size.x * areas.length;
	}
}
