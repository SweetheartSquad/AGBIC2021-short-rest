(() => ({
	door: {
		sprite: 'door',
		interact() {
			window.location.reload();
		},
	},
	skeleton: {
		sprite: 'skeleton',
		health: 3,
		damage: 1,
	},
	bat: {
		sprite: 'bat',
		health: 1,
		damage: 1,
	},
	treasure: {
		sprite: 'treasure',
		start() {
			// play a sound?
		},
		interact(scene) {
			scene.killFacing();
		},
	},
}))();
