import { Manager, Swipe } from '@egjs/hammerjs';

class Swipes {
	x = 0;

	y = 0;

	constructor() {
		const manager = new Manager(document.body);
		manager.add(
			new Swipe({
				threshold: 30,
			})
		);
		manager.on('swipe', (e) => {
			this.x += e.deltaX;
			this.y += e.deltaY;
		});
	}

	update() {
		this.x = 0;
		this.y = 0;
	}
}

export const swipes = new Swipes();
