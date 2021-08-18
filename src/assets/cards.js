(() => ({
	// menus
	init: {
		effect(scene) {
			scene.addCard('start');
			scene.addCard('options');
		},
	},
	start: {
		name: 'Start',
		effect(scene) {
			scene.clearHand();
			scene.addCard('refresh');
		},
	},
	options: {
		name: 'Options',
		effect(scene) {
			scene.clearHand();
			scene.addCard('back');
			scene.addCard('filter');
			scene.addCard('scale');
		},
	},
	filter: {
		name: 'Toggle Filter',
		effect(scene) {
			scene.screenFilter.enabled = !scene.screenFilter.enabled;
			scene.addCard('filter');
		},
	},
	scale: {
		name: 'Cycle Scale Mode',
		effect(scene) {
			window.resizer.scaleMode = {
				FIT: 'MULTIPLES',
				MULTIPLES: 'FIT',
			}[window.resizer.scaleMode];
			window.resizer.onResize();
			scene.addCard('scale');
		},
	},
	back: {
		name: 'Back',
		effect(scene) {
			scene.clearHand();
			scene.addCard('start');
			scene.addCard('options');
		},
	},
	// gameplay
	test: {
		name: 'test',
		description: 'test card',
		effect() {
			console.log('test effect');
		},
		canPlay: () => true,
	},
	refresh: {
		name: 'refresh',
		description: 'gives cards',
		effect(scene) {
			scene.clearHand();
			scene.addCard('test');
			scene.addCard('kill');
			scene.addCard('shuffle');
			scene.addCard('fullheal');
			scene.addCard('refresh');
		},
		canPlay: () => true,
	},
	kill: {
		name: 'kill',
		description: 'kill card',
		effect(scene) {
			scene.killFacing();
		},
		canPlay: (scene) => scene.facing,
	},
	shuffle: {
		name: 'shuffle',
		description: 'Shuffles party',
		effect(scene) {
			const original = scene.party.slice();
			do {
				scene.party.sort((a, b) => {
					if (a.health <= 0 && b.health > 0) return -1;
					if (a.health > 0 && b.health <= 0) return 1;
					return Math.random() - 0.5;
				});
			} while (scene.party.every((i, idx) => i === original[idx]));
		},
	},
	fullheal: {
		name: 'Full Heal',
		description: 'fully heals',
		effect(scene) {
			scene.party.forEach((i) => {
				i.heal(i.maxHealth);
			});
		},
	},
}))();
