(() => ({
	test: {
		name: 'test',
		description: 'test card',
		effect() {
			console.log('test effect');
		},
		canPlay: () => true,
	},
	shuffle: {
		name: 'shuffle',
		description: 'Shuffles party',
		effect(scene) {
			const original = scene.party.slice();
			do {
				scene.party.sort(() => Math.random() - 0.5);
			} while (scene.party.every((i, idx) => i === original[idx]));
		},
	},
}))();
