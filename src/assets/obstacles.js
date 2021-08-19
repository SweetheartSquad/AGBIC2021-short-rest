(() => ({
	door: {
		interact() {
			window.location.reload();
		},
	},
	skeleton: {
		health: 3,
		damage: 1,
	},
	bat: {
		health: 1,
		damage: 1,
	},
	treasure: {
		start() {
			// play a sound?
		},
		interact(scene) {
			scene.killFacing();
		},
	},
}))();
