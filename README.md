# Short Rest

![frog](./src/assets/textures/frog.png)
![cat](./src/assets/textures/cat.png)
![apple](./src/assets/textures/apple.png)
![onion](./src/assets/textures/onion.png)

## Scripts

```sh
npm i # setup
npm start # dev server
npm run build:prod # make build
npm run build # optimize image assets (slow) + make build
```

## Game files

- [`./src/assets/cards.txt`](./src/assets/cards.txt): card definitions + scene cheat sheet
- [`./src/assets/obstacles.txt`](./src/assets/obstacles.txt): obstacle definitions
- [`./src/assets/levels.txt`](./src/assets/levels.txt): level generation
- [`./src/assets/assets.txt`](./src/assets/assets.txt): list of files to load

These are all loaded dynamically at runtime, so you can take a single build and edit them + reload instead of using the dev server.

`cards`, `obstacles`, and `levels` are named `.txt` for annoying build reasons but are actually JS and indirectly `eval`d by the game.
