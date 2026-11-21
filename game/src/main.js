// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, and the renderer paints what is there. The game moves between five screens:
// title, play, paused, round-end and game over.
//
// ?seed=N fixes the scene decoration. ?shot=start|play|round2|end (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.

import { BEST_KEY, PANEL, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_FOUND, EVENT_GAME_OVER, EVENT_HINT, EVENT_ROUND_END, EVENT_WRONG, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_ROUND_END, SCREEN_TITLE } from './world.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, hitButton } from './render.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(seed);
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas);
const state = world.state;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

/** The view the renderer paints: the world state plus the current scene's draw function. */
function view() {
  return Object.assign({}, state, {
    sceneDraw: world.scene().draw,
    differences: world.differences(),
    stars: world.stars(),
  });
}

/** Which picture panel a logical point falls in, with scene coordinates, or null. */
function panelAt(x, y) {
  if (y < PANEL.y || y > PANEL.y + PANEL.height) return null;
  if (x >= PANEL.margin && x <= PANEL.margin + PANEL.width) {
    return { panel: 0, sceneX: x - PANEL.margin, sceneY: y - PANEL.y };
  }
  const rightX = PANEL.margin + PANEL.width + PANEL.gap;
  if (x >= rightX && x <= rightX + PANEL.width) {
    return { panel: 1, sceneX: x - rightX, sceneY: y - PANEL.y };
  }
  return null;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(view(), scene.screen, scene.best, {
      reticle: input.reticle,
      hover: null,
      musicOn: audio.musicOn,
    });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.startGame();
    screen = SCREEN_PLAY;
    announce('Playing. Find 7 differences in each of the 3 rounds.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    audio.gameWin();
    if (state.score > best) {
      best = state.score;
      saveBest(best);
    }
    announce(`Hunt complete. Score ${state.score}. Best ${best}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_FOUND) audio.found();
    if (events & EVENT_WRONG) audio.wrong();
    if (events & EVENT_HINT) audio.hint();
    if (events & EVENT_ROUND_END) {
      screen = SCREEN_ROUND_END;
      audio.roundWin();
      announce(`Round complete. ${state.foundCount} of 7 found.`);
    }
    if (events & EVENT_GAME_OVER) endGame();
  }

  function handlePointer() {
    const point = input.takePointer();
    if (!point) return;
    audio.unlock();
    const pressed = hitButton(screen, state, point.x, point.y);
    if (pressed === 'start') {
      audio.click();
      startGame();
      return;
    }
    if (pressed === 'next') {
      audio.click();
      world.nextRound();
      screen = SCREEN_PLAY;
      announce('Playing the next round.');
      return;
    }
    if (pressed === 'again') {
      audio.click();
      startGame();
      return;
    }
    if (pressed === 'hint') {
      handleEvents(world.useHint());
      return;
    }
    if (pressed === 'pause') {
      if (screen === SCREEN_PLAY) {
        world.pause();
        screen = SCREEN_PAUSED;
      } else if (screen === SCREEN_PAUSED) {
        world.resume();
        screen = SCREEN_PLAY;
      }
      return;
    }
    if (pressed === 'music') {
      audio.toggleMusic();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const hit = panelAt(point.x, point.y);
    if (hit) handleEvents(world.mark(hit.sceneX, hit.sceneY, hit.panel));
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) audio.toggleMusic();
    if (actions & ACTION_HINT && screen === SCREEN_PLAY) handleEvents(world.useHint());
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE) {
        startGame();
      } else if (screen === SCREEN_ROUND_END) {
        world.nextRound();
        screen = SCREEN_PLAY;
      } else if (screen === SCREEN_OVER) {
        startGame();
      } else if (screen === SCREEN_PLAY && input.reticle.visible) {
        const hit = panelAt(input.reticle.x, input.reticle.y);
        if (hit) handleEvents(world.mark(hit.sceneX, hit.sceneY, hit.panel));
      }
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        world.pause();
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        world.resume();
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      state.time += STEP;
      return;
    }
    const events = world.step(STEP);
    handleEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handlePointer();
    handleActions();
    while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
      step();
      accumulator -= STEP;
      if (screen !== SCREEN_TITLE && screen !== SCREEN_PLAY) break;
    }
    if (screen !== SCREEN_TITLE && screen !== SCREEN_PLAY) accumulator = 0;
    renderer.draw(view(), screen, best, {
      reticle: input.reticle,
      hover: input.hover(),
      musicOn: audio.musicOn,
    });
  }

  // Leaving the tab pauses a running game rather than letting the clock run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      world.pause();
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Spot the Difference. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
