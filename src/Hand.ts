import { quadOut } from 'eases';
import { BitmapFont, BitmapText, Texture } from 'pixi.js';
import { getAlphaFilter } from './AlphaFilter';
import { Card } from './Card';
import { filterTextOutline, fontDescription } from './font';
import { game, resources } from './Game';
import { GameObject } from './GameObject';
import { getActiveScene } from './main';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';
import { size } from './size';
import { Tween, TweenManager } from './Tweens';
import { lerp, removeFromArray, wrap } from './utils';

export class Hand extends GameObject {
	transform: Transform;

	display: Display;

	hand: Card[] = [];

	inspecting?: Card;

	textDescription: BitmapText;

	tweenDescription?: Tween;

	constructor() {
		super();
		this.scripts.push((this.transform = new Transform(this)));
		this.scripts.push((this.display = new Display(this)));
		this.display.container.interactiveChildren = true;
		this.display.container.sortableChildren = true;

		BitmapFont.install(
			resources.fontfnt.data,
			resources.fontimg.texture as Texture
		);
		this.textDescription = new BitmapText('', fontDescription);
		this.textDescription.x = size.x / 2;
		this.textDescription.y = size.y - 10 - (fontDescription.fontSize || 0);
		this.textDescription.anchor.x = 0.5;
		this.textDescription.anchor.y = 1.0;
		this.textDescription.alpha = 0;
		this.textDescription.filters = [filterTextOutline, getAlphaFilter()];
		game.app.stage.addChild(this.textDescription);

		this.init();
	}

	destroy() {
		super.destroy();
		this.textDescription.destroy();
	}

	update() {
		const cardSize = (resources.card.texture as Texture).width;
		const cardOverlap = cardSize * 0.3;
		const cardGap = Math.min(
			cardSize - cardOverlap,
			(size.x * 0.8) / this.hand.length
		);
		const handX = size.x / 2;
		const inspectingHand = !!this.inspecting;
		this.hand.forEach((i, idx) => {
			const offset = idx - (this.hand.length - 1) / 2;
			const hovered = this.inspecting === i;
			i.transform.x = lerp(i.transform.x, handX + offset * cardGap, 0.1);
			i.transform.y = lerp(
				i.transform.y,
				inspectingHand ? size.y - 100 - (hovered ? 20 : 0) : size.y + 20,
				0.2
			);
			i.display.container.rotation = lerp(
				i.display.container.rotation,
				hovered || this.hand.length <= 1
					? 0
					: Math.sin((idx / (this.hand.length - 1) - 0.5) * 0.4),
				0.2
			);
		});
	}

	sortZ() {
		const focal = this.inspecting
			? this.hand.indexOf(this.inspecting)
			: undefined;
		this.hand.forEach((i, idx) => {
			i.display.container.zIndex =
				focal === undefined ? 0 : -Math.abs(focal - idx);
		});
	}

	addCard(...options: ConstructorParameters<typeof Card>) {
		const card = new Card(...options);
		this.hand.push(card);
		this.display.container.addChild(card.display.container);
		this.sortZ();
		card.display.container.on('mouseover', () => {
			getActiveScene()?.sfx('sfx5');
			this.inspecting = card;
			this.sortZ();

			this.textDescription.text = wrap(card.def.description || ' ', 50);
			if (this.tweenDescription) TweenManager.abort(this.tweenDescription);
			const quick =
				this.textDescription.alpha > 0 ||
				this.hand.every((i) => i.def.name !== 'Advance');
			this.tweenDescription = TweenManager.tween(
				this.textDescription,
				'alpha',
				1,
				quick ? 500 : 2000,
				undefined,
				quick ? quadOut : (t) => quadOut(Math.max(0, t - 0.5) * 2)
			);
		});
		card.display.container.on('mouseout', () => {
			requestAnimationFrame(() => {
				if (this.inspecting === card) {
					this.stopInspecting();
				}
			});
		});
		card.display.container.on('click', () => {
			this.display.container.emit('play', card);
		});
		card.transform.x = size.x / 2;
		card.transform.y = size.y * 2;
		return card;
	}

	removeCard(card: Card) {
		removeFromArray(this.hand, card);
		if (card === this.inspecting) {
			this.stopInspecting();
		}
		card.destroy();
	}

	stopInspecting() {
		this.inspecting = undefined;
		this.sortZ();
		if (this.tweenDescription) TweenManager.abort(this.tweenDescription);
		this.tweenDescription = TweenManager.tween(
			this.textDescription,
			'alpha',
			0,
			200,
			undefined,
			quadOut
		);
	}
}
