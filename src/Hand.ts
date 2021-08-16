import { Texture } from 'pixi.js';
import { Card } from './Card';
import { resources } from './Game';
import { GameObject } from './GameObject';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';
import { size } from './size';
import { lerp } from './utils';

export class Hand extends GameObject {
	transform: Transform;

	display: Display;

	hand: Card[] = [];

	inspecting?: Card;

	constructor() {
		super();
		this.scripts.push((this.transform = new Transform(this)));
		this.scripts.push((this.display = new Display(this)));
		this.display.container.interactiveChildren = true;

		this.init();
	}

	update() {
		const cardSize = (resources.card.texture as Texture).width;
		const cardOverlap = cardSize * 0.3;
		const cardGap = cardSize - cardOverlap;
		const handX = size.x / 2;
		const inspectingHand = !!this.inspecting;
		this.hand.forEach((i, idx) => {
			const offset = idx - (this.hand.length - 1) / 2;
			const hovered = this.inspecting === i;
			i.transform.x = lerp(i.transform.x, handX + offset * cardGap, 0.1);
			i.transform.y = lerp(
				i.transform.y,
				inspectingHand ? size.y - 100 - (hovered ? 10 : 0) : size.y - 10,
				0.1
			);
			if (inspectingHand && hovered) {
				this.display.container.addChild(i.display.container);
			}
		});
	}

	addCard(...options: ConstructorParameters<typeof Card>) {
		const card = new Card(...options);
		this.hand.push(card);
		this.display.container.addChild(card.display.container);
		card.display.container.on('pointerover', () => {
			this.inspecting = card;
		});
		card.display.container.on('pointerout', () => {
			this.inspecting = undefined;
		});
		card.transform.x = size.x / 2;
		card.transform.y = size.y;
	}
}
