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
			scene.party.sort(() => Math.random() - 0.5);
		},
	},
}))();
