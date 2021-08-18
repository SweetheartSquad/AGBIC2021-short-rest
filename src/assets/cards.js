(() => ({
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
			scene.addCard('test');
			scene.addCard('shuffle');
			scene.addCard('fullheal');
			scene.addCard('refresh');
		},
		canPlay: () => true,
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
				i.setHealth(i.maxHealth);
			});
		},
	},
}))();
