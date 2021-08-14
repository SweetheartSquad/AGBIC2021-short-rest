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
import { Card } from './Card';
import { Character } from './Character';
import { fontTitle } from './font';
import { game, resources } from './Game';
import { GameObject } from './GameObject';
import { getInput } from './main';
import { ScreenFilter } from './ScreenFilter';
import { size } from './size';
import { Tween, TweenManager } from './Tweens';
import { UIMap } from './UIMap';
import { lerp } from './utils';

export class GameScene {
	container = new Container();

	containerUI = new Container();

	containerParty = new Container();

	containerCards = new Container();

	graphics = new Graphics();

	camera = new Camera();

	screenFilter: ScreenFilter;

	hand: Card[] = [];

	map: UIMap = new UIMap();

	bg: TilingSprite;

	position = 0;

	constructor() {
		this.bg = new TilingSprite(resources.bg.texture as Texture, size.x, size.y);
		this.container.addChild(this.bg);

		this.screenFilter = new ScreenFilter();
		this.camera.display.container.filters = [this.screenFilter];

		this.camera.display.container.x -= size.x / 2;
		this.camera.display.container.y -= size.y / 2;
		this.camera.display.container.addChild(this.container);

		this.hand.push(new Card({ name: 'test1', body: 'test 1 description' }));
		this.hand.push(new Card({ name: 'test2', body: 'test 2 description' }));
		this.hand.push(new Card({ name: 'test3', body: 'test 3 description' }));
		this.hand.push(new Card({ name: 'test4', body: 'test 4 description' }));
		this.hand.push(new Card({ name: 'test5', body: 'test 5 description' }));
		this.hand.forEach((i) => {
			this.containerCards.addChild(i.display.container);
		});
		// this.camera.setTarget(player.camPoint);

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
			{ spr: 'frog_rough', maxHealth: 2 },
			{ spr: 'cat_rough', maxHealth: 3 },
			{ spr: 'apple_rough', maxHealth: 2 },
			{ spr: 'onion_rough', maxHealth: 4 },
		];
		this.containerParty = new Container();
		this.containerParty.y += 320;
		const party = partyDef.map((i, idx) => {
			const character = new Character(i);
			character.init();
			character.transform.x += 150 + 75 * idx;
			this.containerParty.addChild(character.display.container);
			return character;
		});
		party[3].setHealth(2);

		const containerEnemies = new Container();
		containerEnemies.y += 320;
		containerEnemies.x = size.x - 150;
		const enemy = new Character({ spr: 'skeleton_rough', maxHealth: 2 });
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
		sprAdvance.interactive = true;
		sprAdvance.buttonMode = true;
		sprAdvance.tabIndex = 0;
		sprAdvance.accessibleTitle = 'advance';
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
		this.containerUI.addChild(this.containerCards);
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

		const input = getInput();
		const cardSize = (resources.card.texture as Texture).width;
		const cardOverlap = cardSize * 0.3;
		const cardGap = cardSize - cardOverlap;
		const handX = size.x / 2;
		const inspectingHand = input.mouse.y > size.y * 0.8;
		this.hand.forEach((i, idx) => {
			const offset = idx - (this.hand.length - 1) / 2;
			const hovered =
				Math.abs(input.mouse.x - (handX + offset * cardGap)) < cardGap / 2;
			i.transform.x = lerp(i.transform.x, handX + offset * cardGap, 0.1);
			i.transform.y = lerp(
				i.transform.y,
				inspectingHand ? size.y - 100 - (hovered ? 100 : 0) : size.y - 10,
				0.1
			);
			if (inspectingHand && hovered) {
				this.containerCards.addChild(i.display.container);
			}
		});

		this.screenFilter.update();

		GameObject.update();
		TweenManager.update();
		this.containerUI.x = this.camera.display.container.pivot.x;
	}

	advance() {
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
	}

	setAreas(areas: string[]) {
		this.map.setAreas(areas);
		this.map.setPosition(0);
		this.bg.width = size.x * areas.length;
	}
}
