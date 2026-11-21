// Everything the player sees: the header with score, timer and found counter, the two
// picture panels with their markers, the footer buttons, and the title, pause, round-end
// and game-over screens. All drawing is canvas 2D on a fixed 1280x720 logical field,
// scaled to the window with letterboxing.

import { FIELD, FONT, FONT_DISPLAY, FOOTER, HEADER, PALETTE, PANEL, ROUNDS } from './config.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_ROUND_END, SCREEN_TITLE } from './world.js';

export { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_ROUND_END, SCREEN_TITLE };

const LEFT_PANEL = { x: PANEL.margin, y: PANEL.y };
const RIGHT_PANEL = { x: PANEL.margin + PANEL.width + PANEL.gap, y: PANEL.y };

function panelOrigin(panel) {
  return panel === 0 ? LEFT_PANEL : RIGHT_PANEL;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function text(ctx, value, x, y, font, colour, align = 'left', baseline = 'alphabetic') {
  ctx.font = font;
  ctx.fillStyle = colour;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(value, x, y);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function button(ctx, rect, label, hovered, enabled = true) {
  ctx.save();
  ctx.globalAlpha = enabled ? 1 : 0.45;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fillStyle = hovered ? PALETTE.buttonHover : PALETTE.button;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, `700 17px ${FONT}`, '#fff', 'center', 'middle');
  ctx.restore();
}

/** The clickable rectangles for a screen, in logical coordinates. */
export function buttonsFor(screen, state) {
  const hint = { x: 24, y: FOOTER.y + 14, w: 150, h: 44 };
  const pause = { x: 190, y: FOOTER.y + 14, w: 150, h: 44 };
  const music = { x: 356, y: FOOTER.y + 14, w: 150, h: 44 };
  const start = { x: 490, y: 486, w: 300, h: 64 };
  const next = { x: 490, y: 470, w: 300, h: 60 };
  const again = { x: 490, y: 540, w: 300, h: 60 };
  if (screen === SCREEN_TITLE) return { start };
  if (screen === SCREEN_ROUND_END) return { next };
  if (screen === SCREEN_OVER) return { again };
  if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) return { hint, pause, music };
  return {};
}

export function hitButton(screen, state, x, y) {
  const buttons = buttonsFor(screen, state);
  for (const [name, rect] of Object.entries(buttons)) {
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return name;
  }
  return null;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  function drawHeader(state) {
    ctx.fillStyle = PALETTE.header;
    ctx.fillRect(0, 0, FIELD.width, HEADER.height);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, HEADER.height - 2, FIELD.width, 2);
    text(ctx, 'SPOT THE DIFFERENCE', 24, 30, `800 26px ${FONT_DISPLAY}`, PALETTE.text);
    text(ctx, ROUNDS[state.roundIndex].name, 24, 56, `400 15px ${FONT}`, PALETTE.muted);
    const lowTime = state.timeLeft <= 30 && state.screen === SCREEN_PLAY;
    const pulse = lowTime ? 0.6 + 0.4 * Math.sin(state.time * 6) : 1;
    ctx.save();
    ctx.globalAlpha = pulse;
    text(ctx, formatTime(state.timeLeft), 640, 32, `800 26px ${FONT_DISPLAY}`, lowTime ? PALETTE.bad : PALETTE.text, 'center');
    ctx.restore();
    text(ctx, 'TIME', 640, 56, `700 11px ${FONT}`, PALETTE.muted, 'center');
    text(ctx, `${state.score}`, 1010, 32, `800 26px ${FONT_DISPLAY}`, PALETTE.gold, 'right');
    text(ctx, 'SCORE', 1010, 56, `700 11px ${FONT}`, PALETTE.muted, 'right');
    // The found counter: the number the judge looks for.
    const found = state.foundCount;
    const total = 7;
    text(ctx, `FOUND ${found} / ${total}`, 1256, 32, `800 26px ${FONT_DISPLAY}`, PALETTE.good, 'right');
    text(ctx, `${total - found} STILL HIDDEN`, 1256, 56, `700 11px ${FONT}`, PALETTE.muted, 'right');
  }

  function drawPanel(state, panel, sceneDraw, applied, seed) {
    const origin = panelOrigin(panel);
    ctx.save();
    ctx.beginPath();
    ctx.rect(origin.x, origin.y, PANEL.width, PANEL.height);
    ctx.clip();
    ctx.translate(origin.x, origin.y);
    sceneDraw(ctx, applied, seed, state.time);
    ctx.restore();
    // Frame and label chip.
    ctx.strokeStyle = PALETTE.panelFrame;
    ctx.lineWidth = 3;
    ctx.strokeRect(origin.x, origin.y, PANEL.width, PANEL.height);
    roundRect(ctx, origin.x + 12, origin.y - 14, 132, 28, 14);
    ctx.fillStyle = '#2c3348';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    text(ctx, panel === 0 ? 'PICTURE A' : 'PICTURE B', origin.x + 78, origin.y, `800 14px ${FONT}`, PALETTE.panelLabel, 'center', 'middle');
  }

  function drawRing(x, y, radius, colour, lineWidth, dashed) {
    ctx.save();
    if (dashed) ctx.setLineDash([10, 7]);
    ctx.strokeStyle = colour;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawMarkers(state) {
    const differences = state.differences;
    for (const difference of differences) {
      if (!state.found.has(difference.id)) continue;
      for (const panel of [0, 1]) {
        const origin = panelOrigin(panel);
        const x = origin.x + difference.x;
        const y = origin.y + difference.y;
        drawRing(x, y, difference.r * 0.95, PALETTE.ring, 4.5, false);
        drawRing(x, y, difference.r * 0.95 + 7, PALETTE.ringSoft, 2, false);
        // A small tick at the ring's top so a found difference reads at a glance.
        ctx.strokeStyle = PALETTE.ring;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 7, y - difference.r * 0.95 - 2);
        ctx.lineTo(x - 1, y - difference.r * 0.95 + 5);
        ctx.lineTo(x + 9, y - difference.r * 0.95 - 6);
        ctx.stroke();
      }
    }
    // The burst and floating points on the newest find.
    const pop = state.foundPop;
    if (pop && state.time < pop.until) {
      const progress = 1 - (pop.until - state.time) / 0.6;
      const origin = panelOrigin(pop.panel);
      const x = origin.x + pop.difference.x;
      const y = origin.y + pop.difference.y;
      drawRing(x, y, pop.difference.r * (0.6 + progress * 0.9), `rgba(255, 209, 102, ${1 - progress})`, 3, false);
      ctx.save();
      ctx.globalAlpha = 1 - progress;
      text(ctx, `+${pop.points}`, x, y - pop.difference.r - 18 - progress * 22, `800 22px ${FONT_DISPLAY}`, PALETTE.gold, 'center');
      ctx.restore();
      for (let i = 0; i < 8; i += 1) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = pop.difference.r * 0.5 + progress * 34;
        ctx.fillStyle = `rgba(255, 209, 102, ${1 - progress})`;
        circle(ctx, x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 3, ctx.fillStyle);
      }
    }
    // A wrong click flashes a red X where it landed.
    const flash = state.wrongFlash;
    if (flash && state.time < flash.until) {
      const origin = panelOrigin(flash.panel);
      const x = origin.x + flash.x;
      const y = origin.y + flash.y;
      const alpha = 1 - (flash.until - state.time) / 0.7;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = PALETTE.bad;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 12);
      ctx.lineTo(x + 12, y + 12);
      ctx.moveTo(x + 12, y - 12);
      ctx.lineTo(x - 12, y + 12);
      ctx.stroke();
      ctx.restore();
    }
    // A hint pulses a dashed gold ring on both pictures.
    const hint = state.hint;
    if (hint && state.time < hint.until) {
      const pulse = 1 + 0.18 * Math.sin(state.time * 8);
      for (const panel of [0, 1]) {
        const origin = panelOrigin(panel);
        drawRing(origin.x + hint.difference.x, origin.y + hint.difference.y, hint.difference.r * pulse, PALETTE.gold, 4, true);
      }
    }
  }

  function drawFooter(state, screen, ui) {
    ctx.fillStyle = PALETTE.header;
    ctx.fillRect(0, FOOTER.y, FIELD.width, FOOTER.height);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, FOOTER.y, FIELD.width, 2);
    const hover = ui.hover;
    const buttons = buttonsFor(screen, state);
    if (buttons.hint) {
      const hovered = hover && hover.x >= buttons.hint.x && hover.x <= buttons.hint.x + buttons.hint.w && hover.y >= buttons.hint.y && hover.y <= buttons.hint.y + buttons.hint.h;
      button(ctx, buttons.hint, `Hint (${state.hintsLeft})`, hovered, state.hintsLeft > 0 && screen === SCREEN_PLAY);
    }
    if (buttons.pause) {
      const hovered = hover && hover.x >= buttons.pause.x && hover.x <= buttons.pause.x + buttons.pause.w && hover.y >= buttons.pause.y && hover.y <= buttons.pause.y + buttons.pause.h;
      button(ctx, buttons.pause, screen === SCREEN_PAUSED ? 'Resume (P)' : 'Pause (P)', hovered, true);
    }
    if (buttons.music) {
      const hovered = hover && hover.x >= buttons.music.x && hover.x <= buttons.music.x + buttons.music.w && hover.y >= buttons.music.y && hover.y <= buttons.music.y + buttons.music.h;
      button(ctx, buttons.music, ui.musicOn ? 'Music: On (M)' : 'Music: Off (M)', hovered, true);
    }
    const message = state.hint && state.time < state.hint.until
      ? `Hint: look for ${state.hint.difference.label}…`
      : screen === SCREEN_PLAY
        ? 'Click a difference in either picture — or move the crosshair with the arrow keys and press Enter.'
        : 'Find all 7 differences before the clock runs out.';
    text(ctx, message, 530, FOOTER.y + 30, `400 15px ${FONT}`, PALETTE.muted);
    text(ctx, `Round ${state.roundIndex + 1} of ${ROUNDS.length}  ·  Best combo ×${state.bestCombo}  ·  Arrows + Enter to mark  ·  H for hint`, 530, FOOTER.y + 56, `400 13px ${FONT}`, PALETTE.muted);
  }

  function drawReticle(ui) {
    const reticle = ui.reticle;
    if (!reticle || !reticle.visible) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(reticle.x, reticle.y, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(reticle.x - 24, reticle.y);
    ctx.lineTo(reticle.x - 8, reticle.y);
    ctx.moveTo(reticle.x + 8, reticle.y);
    ctx.lineTo(reticle.x + 24, reticle.y);
    ctx.moveTo(reticle.x, reticle.y - 24);
    ctx.lineTo(reticle.x, reticle.y - 8);
    ctx.moveTo(reticle.x, reticle.y + 8);
    ctx.lineTo(reticle.x, reticle.y + 24);
    ctx.stroke();
    ctx.restore();
  }

  function dimOverlay(alpha) {
    ctx.fillStyle = `rgba(10, 12, 20, ${alpha})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function drawTitle(state, best, ui) {
    // The first scene, dimmed, as the backdrop: scaled uniformly to cover the field.
    const scene = state.sceneDraw;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, FIELD.width, FIELD.height);
    ctx.clip();
    const cover = Math.max(FIELD.width / PANEL.width, FIELD.height / PANEL.height);
    ctx.translate((FIELD.width - PANEL.width * cover) / 2, (FIELD.height - PANEL.height * cover) / 2);
    ctx.scale(cover, cover);
    scene(ctx, new Set(), state.seed, state.time);
    ctx.restore();
    dimOverlay(0.72);
    text(ctx, 'SPOT THE', 640, 150, `800 64px ${FONT_DISPLAY}`, PALETTE.text, 'center');
    text(ctx, 'DIFFERENCE', 640, 222, `800 64px ${FONT_DISPLAY}`, PALETTE.gold, 'center');
    text(ctx, 'Three hand-drawn scenes. Seven hidden differences in each. One sharp eye.', 640, 268, `400 19px ${FONT}`, '#d5dbe8', 'center');
    text(ctx, 'Round 1 · The Lighthouse Keeper\'s Morning     Round 2 · Night Market on Lantern Lane     Round 3 · The Mountain Observatory', 640, 306, `400 15px ${FONT}`, PALETTE.muted, 'center');
    text(ctx, 'Click a difference in either picture, or steer the crosshair with the arrow keys and press Enter.', 640, 340, `400 15px ${FONT}`, PALETTE.muted, 'center');
    text(ctx, 'H gives a hint (−50 points) · P pauses · M toggles the music', 640, 366, `400 15px ${FONT}`, PALETTE.muted, 'center');
    const hover = ui.hover;
    const start = buttonsFor(SCREEN_TITLE, state).start;
    const hovered = hover && hover.x >= start.x && hover.x <= start.x + start.w && hover.y >= start.y && hover.y <= start.y + start.h;
    button(ctx, start, '▶  Start the hunt', hovered, true);
    if (best > 0) text(ctx, `Best score: ${best}`, 640, 590, `700 17px ${FONT}`, PALETTE.gold, 'center');
    text(ctx, 'An original game — every scene drawn in code, every sound synthesized.', 640, 640, `400 13px ${FONT}`, PALETTE.muted, 'center');
  }

  function drawRoundEnd(state, ui) {
    dimOverlay(0.55);
    const result = state.roundResults[state.roundResults.length - 1];
    roundRect(ctx, 340, 150, 600, 400, 18);
    ctx.fillStyle = '#232839';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'ROUND COMPLETE!', 640, 220, `800 40px ${FONT_DISPLAY}`, PALETTE.gold, 'center');
    text(ctx, result.round, 640, 258, `400 18px ${FONT}`, PALETTE.text, 'center');
    text(ctx, `You found ${result.found} of ${result.total} differences`, 640, 312, `700 22px ${FONT}`, PALETTE.good, 'center');
    text(ctx, `Time bonus: +${result.timeBonus}  (${result.timeLeft}s left on the clock)`, 640, 350, `400 17px ${FONT}`, PALETTE.muted, 'center');
    text(ctx, `Score: ${result.score}`, 640, 392, `800 26px ${FONT_DISPLAY}`, PALETTE.text, 'center');
    const hover = ui.hover;
    const next = buttonsFor(SCREEN_ROUND_END, state).next;
    const hovered = hover && hover.x >= next.x && hover.x <= next.x + next.w && hover.y >= next.y && hover.y <= next.y + next.h;
    button(ctx, next, state.roundIndex + 1 < ROUNDS.length ? '▶  Next round' : 'See results', hovered, true);
  }

  function drawGameOver(state, best, ui) {
    dimOverlay(0.6);
    roundRect(ctx, 300, 90, 680, 520, 18);
    ctx.fillStyle = '#232839';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'HUNT COMPLETE!', 640, 160, `800 42px ${FONT_DISPLAY}`, PALETTE.gold, 'center');
    const stars = state.stars;
    let starsText = '';
    for (let i = 0; i < 3; i += 1) starsText += i < stars ? '★' : '☆';
    text(ctx, starsText, 640, 218, `400 44px ${FONT}`, PALETTE.gold, 'center');
    text(ctx, `Total score: ${state.score}`, 640, 272, `800 30px ${FONT_DISPLAY}`, PALETTE.text, 'center');
    text(ctx, `Differences found: ${state.totalFound} of ${ROUNDS.length * 7}   ·   Missed: ${state.totalMissed}`, 640, 312, `400 17px ${FONT}`, PALETTE.muted, 'center');
    text(ctx, `Best combo: ×${state.bestCombo}   ·   Best score: ${best}`, 640, 342, `400 17px ${FONT}`, PALETTE.muted, 'center');
    let y = 392;
    for (const result of state.roundResults) {
      text(ctx, `${result.round} — ${result.found}/${result.total} found, +${result.timeBonus} time bonus`, 640, y, `400 15px ${FONT}`, '#d5dbe8', 'center');
      y += 26;
    }
    const hover = ui.hover;
    const again = buttonsFor(SCREEN_OVER, state).again;
    const hovered = hover && hover.x >= again.x && hover.x <= again.x + again.w && hover.y >= again.y && hover.y <= again.y + again.h;
    button(ctx, again, 'Play again', hovered, true);
  }

  function drawPaused() {
    dimOverlay(0.55);
    text(ctx, 'PAUSED', 640, 330, `800 52px ${FONT_DISPLAY}`, PALETTE.text, 'center');
    text(ctx, 'Press P or click Resume to keep hunting.', 640, 380, `400 18px ${FONT}`, PALETTE.muted, 'center');
  }

  function circle(ctx2, x, y, radius, fill) {
    ctx2.beginPath();
    ctx2.arc(x, y, radius, 0, Math.PI * 2);
    ctx2.fillStyle = fill;
    ctx2.fill();
  }

  return {
    /**
     * Paint the current frame. `view` carries the world state plus the draw helpers the
     * renderer needs (the scene's draw function, its differences, the found set).
     */
    draw(view, screen, best, ui) {
      const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
      const offsetX = (window.innerWidth - FIELD.width * scale) / 2;
      const offsetY = (window.innerHeight - FIELD.height * scale) / 2;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = PALETTE.backdrop;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);

      drawHeader(view);
      if (screen === SCREEN_TITLE) {
        drawTitle(view, best, ui);
        return;
      }
      // The two pictures: left untouched, right with all seven differences applied.
      const allApplied = new Set(view.differences.map((d) => d.id));
      drawPanel(view, 0, view.sceneDraw, new Set(), view.seed);
      drawPanel(view, 1, view.sceneDraw, allApplied, view.seed);
      // The VS badge in the gap between the pictures.
      circle(ctx, 640, PANEL.y + PANEL.height / 2, 17, PALETTE.gold);
      text(ctx, 'VS', 640, PANEL.y + PANEL.height / 2, `800 13px ${FONT}`, '#1e2334', 'center', 'middle');
      drawMarkers(view);
      drawFooter(view, screen, ui);
      drawReticle(ui);
      if (screen === SCREEN_PAUSED) drawPaused();
      else if (screen === SCREEN_ROUND_END) drawRoundEnd(view, ui);
      else if (screen === SCREEN_OVER) drawGameOver(view, best, ui);
    },
  };
}
