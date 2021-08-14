import {
	Container,
	Graphics,
	NineSlicePlane,
	Sprite,
	Text,
	Texture,
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
import { TweenManager } from './Tweens';
import { UIMap } from './UIMap';
import { lerp } from './utils';

export class GameScene {
	container = new Container();

	graphics = new Graphics();

	camera = new Camera();

	screenFilter: ScreenFilter;

	hand: Card[] = [];

	map: UIMap = new UIMap();

	position = 0;

	constructor() {
		this.graphics.beginFill(0x123456);
		this.graphics.drawRect(0, 0, size.x, size.y);
		this.graphics.endFill();
		this.container.addChildAt(this.graphics, 0);

		const bg = new Sprite(resources.bg.texture as Texture);
		this.container.addChild(bg);

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
			this.container.addChild(i.display.container);
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
		this.camera.display.container.addChild(border);

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
		const containerParty = new Container();
		containerParty.y += 320;
		containerParty.x += 150;
		this.container.addChild(containerParty);
		const party = partyDef.map((i, idx) => {
			const character = new Character(i);
			character.init();
			character.transform.x += 75 * idx;
			containerParty.addChild(character.display.container);
			return character;
		});
		party[3].setHealth(2);

		const containerEnemies = new Container();
		containerEnemies.y += 320;
		containerEnemies.x = size.x - 150;
		this.container.addChild(containerEnemies);
		const enemy = new Character({ spr: 'skeleton_rough', maxHealth: 2 });
		enemy.init();
		containerEnemies.addChild(enemy.display.container);

		this.container.addChild(this.map.display.container);

		this.map.setAreas([
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
		this.map.setPosition(0);
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
				this.container.addChild(i.display.container);
			}
		});

		this.screenFilter.update();

		GameObject.update();
		TweenManager.update();
	}

	advance() {
		this.position += 1;
		this.map.setPosition(this.position);
	}
}
