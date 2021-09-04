import { BitmapText, Sprite } from 'pixi.js';
import { getAlphaFilter } from './AlphaFilter';
import { fontName } from './font';
import { resources } from './Game';
import { GameObject } from './GameObject';
import { GameScene } from './GameScene';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';
import { btn, evalFn, tex, wrap } from './utils';

export type CardDef = {
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
			Card.cards = evalFn(resources.cards.data);
			Object.entries(Card.cards).forEach(([name, card]) => {
				(card as CardDef).name = (card as CardDef).name || name;
				(card as CardDef).description = card?.description || ' ';
			});
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

	static getCardSpr(def: string | CardDef, ui = false) {
		const d = Card.getCard(def);
		const sprCard = new Sprite(resources[ui ? 'card_ui' : 'card'].texture);
		sprCard.anchor.x = sprCard.anchor.y = 0.5;
		const sprImg = new Sprite(tex(d.sprite || d.name));
		sprImg.anchor.x = sprImg.anchor.y = 0.5;
		const textName = new BitmapText(wrap(d.name, 8), fontName);
		textName.y += 47;
		textName.anchor.x = textName.anchor.y = 0.5;
		textName.x = 0;
		textName.tint = 0x33252b;
		sprCard.addChild(sprImg);
		sprCard.addChild(textName);
		return sprCard;
	}

	transform: Transform;

	display: Display;

	sprCard: Sprite;

	def: CardDef;

	constructor(def: string | CardDef, ui?: boolean) {
		super();
		this.def = Card.getCard(def);
		const { name, description } = this.def;
		this.scripts.push((this.transform = new Transform(this)));
		this.scripts.push((this.display = new Display(this)));

		this.sprCard = Card.getCardSpr(this.def, ui);
		this.sprCard.anchor.x = this.sprCard.anchor.y = 0.5;
		this.display.container.addChild(this.sprCard);
		this.display.container.filters = [getAlphaFilter()];

		btn(this.display.container, name, `${name}: ${description}`);

		this.init();
	}

	update() {
		this.display.container.position.x = this.transform.x;
		this.display.container.position.y = this.transform.y;
	}
}
