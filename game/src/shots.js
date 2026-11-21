// The screenshot scenes behind ?shot=start|play|round2|end. Each one stages a real game
// state — the same world a player would reach — so the frame is what the game really looks
// like and the same seed always gives the same frame.
//
//   start  — the title screen over the first scene.
//   play   — round 1 mid-hunt: 3 of 7 differences found, rings on both pictures, the
//             counter reading FOUND 3 / 7 and the clock at 2:17.
//   round2 — round 2 mid-hunt: 2 of 7 found on the night market scene.
//   end    — the final screen after all three rounds, with stars and the total score.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

export function stageShot(name, world) {
  const state = world.state;
  if (name === 'play') {
    world.startGame();
    state.timeLeft = 137;
    state.score = 320;
    state.combo = 2;
    state.bestCombo = 2;
    const firstThree = world.differences().slice(0, 3);
    for (const difference of firstThree) state.found.add(difference.id);
    state.foundCount = 3;
    state.foundPop = { difference: firstThree[2], panel: 1, until: state.time + 0.6, points: 130 };
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'round2') {
    world.startGame();
    // Round 1 finished cleanly, round 2 in progress.
    state.roundResults.push({
      round: 'The Lighthouse Keeper\'s Morning',
      found: 7,
      total: 7,
      timeLeft: 61,
      timeBonus: 122,
      score: 820,
    });
    state.totalFound = 7;
    state.score = 820;
    world.nextRound();
    state.timeLeft = 98;
    state.score = 820;
    const firstTwo = world.differences().slice(0, 2);
    for (const difference of firstTwo) state.found.add(difference.id);
    state.foundCount = 2;
    return { screen: SCREEN_PLAY, best: 820 };
  }
  if (name === 'end') {
    world.startGame();
    for (const round of [0, 1, 2]) {
      state.roundIndex = round;
      state.found = new Set(world.differences().map((d) => d.id));
      state.foundCount = 7;
      state.timeLeft = 40 + round * 12;
      state.score += 700 + 100 * round + Math.round(state.timeLeft) * 2;
      state.roundResults.push({
        round: ['The Lighthouse Keeper\'s Morning', 'Night Market on Lantern Lane', 'The Mountain Observatory'][round],
        found: 7,
        total: 7,
        timeLeft: Math.round(state.timeLeft),
        timeBonus: Math.round(state.timeLeft) * 2,
        score: state.score,
      });
    }
    state.totalFound = 21;
    state.totalMissed = 0;
    state.bestCombo = 7;
    state.screen = SCREEN_OVER;
    return { screen: SCREEN_OVER, best: state.score };
  }
  world.startGame();
  state.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE, best: 0 };
}
