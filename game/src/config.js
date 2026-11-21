// Every tuning number, colour and layout constant in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends on
// the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Seconds on the clock for each round. */
export const ROUND_SECONDS = 150;

/** How many differences hide in every scene. */
export const DIFFERENCES_PER_ROUND = 7;

/** Hints a player starts with each round; a hint costs points, not a life. */
export const HINTS_PER_ROUND = 3;
export const HINT_COST = 50;

/** Points for a find, plus a combo bonus for finds without a miss in between. */
export const FIND_POINTS = 100;
export const COMBO_BONUS = 15;
/** Points lost for a wrong click (score never goes below zero). */
export const MISS_PENALTY = 25;
/** Points per second left on the clock when a round ends. */
export const TIME_BONUS_PER_SECOND = 2;

/** Click tolerance, in scene pixels, around a difference's centre. */
export const MARK_RADIUS = 34;

/** How long, in seconds, a hint ring pulses on an unfound difference. */
export const HINT_SECONDS = 3;

/** The two picture panels, in logical coordinates. */
export const PANEL = { width: 604, height: 512, y: 96, gap: 24, margin: 24 };
export const HEADER = { height: 72 };
export const FOOTER = { y: 632, height: 88 };

export const PALETTE = {
  backdrop: '#171a26',
  panelFrame: '#2c3348',
  panelLabel: '#dfe6f5',
  header: '#1e2334',
  text: '#f2f4fa',
  muted: '#9aa3b8',
  accent: '#ffd166',
  accentDark: '#e8a93d',
  good: '#7ee787',
  bad: '#ff6b6b',
  ring: '#ff4757',
  ringSoft: 'rgba(255, 71, 87, 0.35)',
  button: '#3b82f6',
  buttonHover: '#5b9bff',
  gold: '#ffd166',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const FONT_DISPLAY = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'spot-the-difference.best';

/** The three rounds, in order. */
export const ROUNDS = [
  { id: 'lighthouse', name: "The Lighthouse Keeper's Morning", scene: 'lighthouse' },
  { id: 'market', name: 'Night Market on Lantern Lane', scene: 'market' },
  { id: 'observatory', name: 'The Mountain Observatory', scene: 'observatory' },
];
