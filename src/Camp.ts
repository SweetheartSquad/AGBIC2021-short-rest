import { Sprite } from 'pixi.js';
import { GameObject } from './GameObject';
import { Animator } from './Scripts/Animator';
import { Display } from './Scripts/Display';
import { size } from './size';
import { tex } from './utils';

export class Camp extends GameObject {
	display: Display;

	animator: Animator;

	constructor() {
		super();
		const sprBg = new Sprite(tex('camp_bg'));
		const sprFire = new Sprite(tex('camp_unlit'));
		sprFire.anchor.x = 0.5;
		sprFire.anchor.y = 1.0;
		sprFire.x = size.x / 2;
		sprFire.y = size.y * 0.75;
		const camp = new GameObject();
		this.display = new Display(camp);
		this.animator = new Animator(camp, { spr: sprFire });
		camp.scripts.push(this.display);
		camp.scripts.push(this.animator);
		camp.init();
		this.display.container.addChild(sprBg);
		this.display.container.addChild(sprFire);
	}

	light() {
		this.animator.setAnimation('camp_lit');
	}

	douse() {
		this.animator.setAnimation('camp_unlit');
	}
}
