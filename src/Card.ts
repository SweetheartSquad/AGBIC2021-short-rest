import { Sprite, Text } from 'pixi.js';
import { font } from './font';
import { resources } from './Game';
import { GameObject } from './GameObject';
import { GameScene } from './GameScene';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';
import { btn } from './utils';

type CardDef = {
	name: string;
	description?: string;
	canPlay?: (scene: GameScene) => boolean;
	effect: (scene: GameScene) => void;
};

export class Card extends GameObject {
	static cards: Partial<Record<string, CardDef>>;

	static getCard(def: string | CardDef) {
		if (!Card.cards) {
			// eslint-disable-next-line @typescript-eslint/no-implied-eval
			Card.cards = Function(`"use strict";return ${resources.cards.data}`)();
		}
		return (
			(typeof def === 'string' ? Card.cards[def] : def) || {
				name: 'error',
				description: `couldn't find card "${def}"`,
				effect: () => {},
				canPlay: () => false,
			}
		);
	}

	transform: Transform;

	display: Display;

	sprCard: Sprite;

	textName: Text;

	textDescription: Text;

	def: CardDef;

	constructor(def: string | CardDef) {
		super();
		this.def = Card.getCard(def);
		const { name, description } = this.def;
		this.scripts.push((this.transform = new Transform(this)));
		this.scripts.push((this.display = new Display(this)));

		this.sprCard = new Sprite(resources.card.texture);
		this.sprCard.anchor.x = this.sprCard.anchor.y = 0.5;
		this.display.container.addChild(this.sprCard);
		this.textName = new Text(name, font);
		this.textDescription = new Text(description || '', font);
		this.display.container.addChild(this.textName);
		this.display.container.addChild(this.textDescription);
		this.textName.y -= this.sprCard.height / 2 - 10;
		this.textName.x -= this.sprCard.width / 2 - 10;
		this.textDescription.style.wordWrap = true;
		this.textDescription.style.wordWrapWidth = this.sprCard.width - 10;
		this.textDescription.y += 50;
		this.textDescription.x -= this.sprCard.width / 2 - 5;

		btn(this.display.container, name, `${name}: ${description}`);

		this.init();
	}

	update() {
		this.display.container.position.x = this.transform.x;
		this.display.container.position.y = this.transform.y;
	}
}
