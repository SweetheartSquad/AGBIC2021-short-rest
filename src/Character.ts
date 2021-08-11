import { OutlineFilter } from 'pixi-filters';
import { Sprite, Texture } from 'pixi.js';
import { resources } from './Game';
import { GameObject } from './GameObject';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';

const filterOL = new OutlineFilter(2, 0xffffff);

export class Character extends GameObject {
	sprOL: Sprite;

	sprBody: Sprite;

	transform: Transform;

	display: Display;

	constructor(spr: string) {
		super();
		this.scripts.push((this.transform = new Transform(this)));
		this.scripts.push((this.display = new Display(this)));
		this.sprOL = new Sprite(resources[spr].texture as Texture);
		this.sprOL.tint = 0x000000;
		this.sprOL.x += -2;
		this.sprOL.filters = [filterOL];
		this.sprBody = new Sprite(resources[spr].texture as Texture);
		this.display.container.addChild(this.sprOL);
		this.display.container.addChild(this.sprBody);
	}
}
