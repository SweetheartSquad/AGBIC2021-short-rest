import { OutlineFilter } from 'pixi-filters';
import { BitmapFont, BitmapText, Texture } from 'pixi.js';
import { Card } from './Card';
import { fontDescription } from './font';
import { game, resources } from './Game';
import { GameObject } from './GameObject';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';
import { size } from './size';
import { lerp, removeFromArray } from './utils';

export class Hand extends GameObject {
	transform: Transform;

	display: Display;

	hand: Card[] = [];

	inspecting?: Card;

	textDescription: BitmapText;

	constructor() {
		super();
		this.scripts.push((this.transform = new Transform(this)));
		this.scripts.push((this.display = new Display(this)));
		this.display.container.interactiveChildren = true;

		BitmapFont.install(
			resources.fontfnt.data,
			resources.fontimg.texture as Texture
		);
		this.textDescription = new BitmapText('', fontDescription);
		this.textDescription.x = size.x / 2;
		this.textDescription.y = size.y - 10 - (fontDescription.fontSize || 0);
		this.textDescription.anchor.x = 0.5;
		this.textDescription.anchor.y = 1.0;
		this.textDescription.filters = [new OutlineFilter(4, 0, 1)];
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
				inspectingHand ? size.y - 100 - (hovered ? 20 : 0) : size.y - 10,
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
		this.textDescription.text =
			this.inspecting?.def.description || this.textDescription.text;
		this.textDescription.alpha = lerp(
			this.textDescription.alpha,
			this.inspecting?.def.description ? 1 : -100,
			0.1
		);
	}

	addCard(...options: ConstructorParameters<typeof Card>) {
		const card = new Card(...options);
		this.hand.push(card);
		this.display.container.addChild(card.display.container);
		card.display.container.on('pointerover', () => {
			this.inspecting = card;
			this.display.container.addChild(card.display.container);
		});
		card.display.container.on('pointerout', () => {
			this.display.container.addChildAt(
				card.display.container,
				this.hand.indexOf(card)
			);
			requestAnimationFrame(() => {
				if (this.inspecting === card) {
					this.inspecting = undefined;
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
			this.inspecting = undefined;
		}
		card.destroy();
	}
}
