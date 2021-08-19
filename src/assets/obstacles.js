(() => ({
	door: {
		interact(scene) {
			scene.startCamp();
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
				scene.obstacle.animator.setAnimation('treasure_open');
				await scene.delay(100);
				scene.killObstacle();
			});
		},
	},
	cube_big: {
		health: 3,
		damage: 1,
		end(scene) {
			scene.addObstacle('cube_small');
			scene.addObstacle('cube_small');
		},
	},
	cube_small: {
		health: 1,
		damage: 1,
		end(scene) {
			scene.addObstacle('cube_tiny');
			scene.addObstacle('cube_tiny');
		},
	},
	cube_tiny: {
		health: 1,
	},
}))();
