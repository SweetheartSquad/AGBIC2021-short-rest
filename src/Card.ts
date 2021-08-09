import { Sprite, Text } from 'pixi.js';
import { font } from './font';
import { resources } from './Game';
import { GameObject } from './GameObject';
import { Display } from './Scripts/Display';
import { Transform } from './Scripts/Transform';

export class Card extends GameObject {
	transform: Transform;

	display: Display;

	sprCard: Sprite;

	textName: Text;

	textBody: Text;

	constructor({ name, body }: { name: string; body: string }) {
		super();
		this.scripts.push((this.transform = new Transform(this)));
		this.scripts.push((this.display = new Display(this)));

		this.sprCard = new Sprite(resources.card.texture);
		this.sprCard.anchor.x = this.sprCard.anchor.y = 0.5;
		this.display.container.addChild(this.sprCard);
		this.textName = new Text(name, font);
		this.textBody = new Text(body, font);
		this.display.container.addChild(this.textName);
		this.display.container.addChild(this.textBody);
		this.textName.y -= 50;
		this.textName.x -= 50;
		this.textBody.y += 50;
	}

	update() {
		this.display.container.position.x = this.transform.x;
		this.display.container.position.y = this.transform.y;
	}
}
