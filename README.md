[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/imnotripper/spot-the-difference-game/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/imnotripper/spot-the-difference-game/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

# Spot the Difference

A complete spot-the-difference game, built for the [make.fun bounty](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451). Two near-identical pictures sit side by side; seven differences hide in each scene. Find them all before the clock runs out.

Every scene is drawn from scratch in canvas 2D — no copied art, no copied characters — and every sound is synthesized with WebAudio. No network requests, no build step: `game/` is plain static files.

## The three rounds

1. **The Lighthouse Keeper's Morning** — a sunny coast, a striped lighthouse, a little red boat.
2. **Night Market on Lantern Lane** — lanterns, dumplings and a cat asleep on a tea stall.
3. **The Mountain Observatory** — a dusk sky, a comet, and a telescope pointed at the stars.

Each round hides 7 differences, some fair and some sneaky: a missing gull, a sail that changed colour, a window gone dark, a cat that wandered off.

## How to play

- **Mouse / touch:** click a difference in either picture. Found differences get a red ring on both pictures.
- **Keyboard:** move the crosshair with the arrow keys (hold Shift for big steps), press **Enter** or **Space** to mark.
- **H** — hint: a pulsing gold ring shows one difference still hidden (−50 points, 3 per round).
- **P** — pause. **M** — toggle the music.
- A wrong click costs 25 points and breaks your combo; finds in a row earn a growing combo bonus. Finishing a round early earns a time bonus.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshot scenes (deterministic, seeded): `?shot=start&seed=1`, `?shot=play&seed=1`, `?shot=round2&seed=1`, `?shot=end&seed=1`.

## Layout

- `game/index.html` — the page; `game/src/main.js` — boot and the game loop.
- `game/src/config.js` — tuning numbers, palette and layout.
- `game/src/scenes.js` — the three hand-drawn scenes and their differences.
- `game/src/world.js` — rounds, score, timer, hints and find/miss rules.
- `game/src/render.js` — everything drawn on screen.
- `game/src/input.js` — keyboard and pointer input, the crosshair.
- `game/src/audio.js` — synthesized sounds and the music loop.
- `game/src/shots.js` — the staged screenshot scenes.
- `main.ts` — the make.fun hand-in program (copies `game/` and `screenshots/`, writes `dossier.json`).
- `screenshots/` — real renders of the game in a browser.
