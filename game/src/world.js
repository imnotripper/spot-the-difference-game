// The game state: rounds, found differences, score, timer, hints and the events a find
// or a miss raises. The world knows nothing about drawing or input; main.js drives it.

import {
  COMBO_BONUS,
  DIFFERENCES_PER_ROUND,
  FIND_POINTS,
  HINTS_PER_ROUND,
  HINT_COST,
  HINT_SECONDS,
  MARK_RADIUS,
  MISS_PENALTY,
  ROUNDS,
  ROUND_SECONDS,
  TIME_BONUS_PER_SECOND,
} from './config.js';
import { SCENES } from './scenes.js';

export const EVENT_FOUND = 1;
export const EVENT_WRONG = 2;
export const EVENT_HINT = 4;
export const EVENT_ROUND_END = 8;
export const EVENT_GAME_OVER = 16;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_ROUND_END = 'round-end';
export const SCREEN_OVER = 'over';

export function createWorld(seed) {
  const state = {
    seed,
    roundIndex: 0,
    screen: SCREEN_TITLE,
    score: 0,
    combo: 0,
    bestCombo: 0,
    found: new Set(),
    foundCount: 0,
    totalFound: 0,
    totalMissed: 0,
    timeLeft: ROUND_SECONDS,
    hintsLeft: HINTS_PER_ROUND,
    hint: null, // { difference, until } while a hint ring is pulsing
    wrongFlash: null, // { x, y, panel, until } while a wrong-click X shows
    foundPop: null, // { difference, panel, until } for the find burst animation
    roundResults: [], // { round, found, timeLeft, timeBonus, score } per finished round
    time: 0,
    paused: false,
  };

  function scene() {
    return SCENES[ROUNDS[state.roundIndex].scene];
  }

  function differences() {
    return scene().differences;
  }

  function startRound(index) {
    state.roundIndex = index;
    state.found = new Set();
    state.foundCount = 0;
    state.timeLeft = ROUND_SECONDS;
    state.hintsLeft = HINTS_PER_ROUND;
    state.hint = null;
    state.wrongFlash = null;
    state.foundPop = null;
    state.combo = 0;
    state.screen = SCREEN_PLAY;
  }

  function finishRound() {
    const timeBonus = Math.round(state.timeLeft) * TIME_BONUS_PER_SECOND;
    state.score += timeBonus;
    state.roundResults.push({
      round: ROUNDS[state.roundIndex].name,
      found: state.foundCount,
      total: DIFFERENCES_PER_ROUND,
      timeLeft: Math.round(state.timeLeft),
      timeBonus,
      score: state.score,
    });
    state.totalFound += state.foundCount;
    state.totalMissed += DIFFERENCES_PER_ROUND - state.foundCount;
    if (state.roundIndex + 1 >= ROUNDS.length) {
      state.screen = SCREEN_OVER;
      return EVENT_GAME_OVER;
    }
    state.screen = SCREEN_ROUND_END;
    return EVENT_ROUND_END;
  }

  return {
    state,

    /** The scene of the current round, with its draw function and differences. */
    scene,
    differences,

    reset() {
      state.roundIndex = 0;
      state.score = 0;
      state.combo = 0;
      state.bestCombo = 0;
      state.totalFound = 0;
      state.totalMissed = 0;
      state.roundResults = [];
      startRound(0);
    },

    startGame() {
      state.score = 0;
      state.combo = 0;
      state.bestCombo = 0;
      state.totalFound = 0;
      state.totalMissed = 0;
      state.roundResults = [];
      startRound(0);
    },

    nextRound() {
      startRound(state.roundIndex + 1);
    },

    pause() {
      if (state.screen === SCREEN_PLAY) state.screen = SCREEN_PAUSED;
    },

    resume() {
      if (state.screen === SCREEN_PAUSED) state.screen = SCREEN_PLAY;
    },

    /**
     * Mark the point (sceneX, sceneY) on either panel. Returns an event mask.
     * A click near an unfound difference finds it; anywhere else in a picture is a miss.
     */
    mark(sceneX, sceneY, panel) {
      if (state.screen !== SCREEN_PLAY) return 0;
      let nearest = null;
      let nearestDistance = Infinity;
      for (const difference of differences()) {
        if (state.found.has(difference.id)) continue;
        const dx = sceneX - difference.x;
        const dy = sceneY - difference.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = difference;
        }
      }
      if (nearest !== null && nearestDistance <= MARK_RADIUS + nearest.r * 0.4) {
        state.found.add(nearest.id);
        state.foundCount += 1;
        state.combo += 1;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        const gained = FIND_POINTS + COMBO_BONUS * (state.combo - 1);
        state.score += gained;
        state.foundPop = { difference: nearest, panel, until: state.time + 0.6, points: gained };
        state.hint = null;
        if (state.foundCount >= DIFFERENCES_PER_ROUND) return EVENT_FOUND | finishRound();
        return EVENT_FOUND;
      }
      state.combo = 0;
      state.score = Math.max(0, state.score - MISS_PENALTY);
      state.wrongFlash = { x: sceneX, y: sceneY, panel, until: state.time + 0.7 };
      return EVENT_WRONG;
    },

    /** Spend a hint: pulse a ring on a random difference still unfound. */
    useHint() {
      if (state.screen !== SCREEN_PLAY || state.hintsLeft <= 0) return 0;
      const remaining = differences().filter((d) => !state.found.has(d.id));
      if (remaining.length === 0) return 0;
      state.hintsLeft -= 1;
      state.score = Math.max(0, state.score - HINT_COST);
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      state.hint = { difference: pick, until: state.time + HINT_SECONDS };
      return EVENT_HINT;
    },

    /** Advance the clock by dt seconds; the timer runs only while playing. */
    step(dt) {
      state.time += dt;
      if (state.screen !== SCREEN_PLAY) return 0;
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        return finishRound();
      }
      return 0;
    },

    /** How many differences are still hidden in this round. */
    remaining() {
      return DIFFERENCES_PER_ROUND - state.foundCount;
    },

    /** The round's final grade: 3 stars for a perfect hunt, 2 for most, else 1. */
    stars() {
      if (state.totalFound >= ROUNDS.length * DIFFERENCES_PER_ROUND) return 3;
      if (state.totalFound >= ROUNDS.length * DIFFERENCES_PER_ROUND - 3) return 2;
      return 1;
    },
  };
}
