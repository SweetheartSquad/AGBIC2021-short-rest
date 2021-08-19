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
			scene.queue.push(async () => {
				scene.facing.animator.setAnimation('treasure_open');
				await scene.delay(100);
				scene.killFacing();
			});
		},
	},
}))();
