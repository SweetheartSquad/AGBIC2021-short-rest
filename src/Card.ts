import { Sprite, Text } from 'pixi.js';
import { fontName } from './font';
import { resources } from './Game';
import { GameObject } from './GameObject';
import { GameScene } from './GameScene';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';
import { btn, tex } from './utils';

type CardDef = {
	name: string;
	sprite?: string;
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

	static getCardSpr(def: string | CardDef) {
		const d = Card.getCard(def);
		const sprCard = new Sprite(resources.card.texture);
		sprCard.anchor.x = sprCard.anchor.y = 0.5;
		const sprImg = new Sprite(tex(d.sprite || d.name));
		sprImg.anchor.x = sprImg.anchor.y = 0.5;
		sprImg.y = -50;
		const textName = new Text(d.name, fontName);
		textName.y += 51;
		textName.anchor.x = textName.anchor.y = 0.5;
		textName.style.wordWrap = true;
		textName.style.wordWrapWidth = sprCard.width - 50;
		textName.x = 0;
		sprCard.addChild(sprImg);
		sprCard.addChild(textName);
		return sprCard;
	}

	transform: Transform;

	display: Display;

	sprCard: Sprite;

	def: CardDef;

	constructor(def: string | CardDef) {
		super();
		this.def = Card.getCard(def);
		const { name, description } = this.def;
		this.scripts.push((this.transform = new Transform(this)));
		this.scripts.push((this.display = new Display(this)));

		this.sprCard = Card.getCardSpr(this.def);
		this.sprCard.anchor.x = this.sprCard.anchor.y = 0.5;
		this.display.container.addChild(this.sprCard);

		btn(this.display.container, name, `${name}: ${description}`);

		this.init();
	}

	update() {
		this.display.container.position.x = this.transform.x;
		this.display.container.position.y = this.transform.y;
	}
}
