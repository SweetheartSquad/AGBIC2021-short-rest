import { Sprite } from 'pixi.js';
import { GameObject } from './GameObject';
import { Animator } from './Scripts/Animator';
import { Display } from './Scripts/Display';
import { tex } from './utils';

export class Camp extends GameObject {
	display: Display;

	animator: Animator;

	constructor() {
		super();
		const sprBg = new Sprite(tex('camp_bg'));
		const camp = new GameObject();
		this.display = new Display(camp);
		this.animator = new Animator(camp, { spr: sprBg });
		camp.scripts.push(this.display);
		camp.scripts.push(this.animator);
		camp.init();
		this.display.container.addChild(sprBg);
	}

	light() {
		this.animator.setAnimation(tex('camp_bg_lit').textureCacheIds[0]);
	}

	douse() {
		this.animator.setAnimation(tex('camp_bg').textureCacheIds[0]);
	}
}
