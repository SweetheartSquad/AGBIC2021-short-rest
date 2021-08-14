import { OutlineFilter } from 'pixi-filters';
import { Graphics, Sprite, Texture } from 'pixi.js';
import { resources } from './Game';
import { GameObject } from './GameObject';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';
import { size } from './size';

const filterOL = new OutlineFilter(2, 0xffffff, 0);

export class UIMap extends GameObject {
	display: Display;

	transform: Transform;

	graphics: Graphics;

	constructor() {
		super();
		this.scripts.push((this.transform = new Transform(this)));
		this.scripts.push((this.display = new Display(this)));

		this.graphics = new Graphics();

		this.display.container.addChild(this.graphics);

		const mapDef = [
			'camp',
			'enemy',
			'enemy',
			'treasure',
			'unknown',
			'attention',
			'enemy',
			'treasure',
			'door',
		];
		mapDef.forEach((i, idx) => {
			const icon = new Sprite(resources[`icon_${i}`].texture as Texture);
			icon.x += 50 * idx;
			this.display.container.addChild(icon);
			icon.anchor.x = icon.anchor.y = 0.5;
			icon.filters = [filterOL];
		});
		this.transform.x = size.x / 2 - this.display.container.width / 2;
		this.transform.y += 50;

		const b = this.display.container.getBounds(true);
		this.graphics.clear();
		this.graphics.beginFill(0xffffff);
		this.graphics.drawRect(b.left + 25, -3, b.width - 50, 6);
		this.graphics.endFill();
		this.graphics.beginFill(0x000000);
		this.graphics.drawRect(b.left + 25 + 2, -2, b.width - 50 - 4, 4);
		this.graphics.endFill();

		this.init();
	}
}
