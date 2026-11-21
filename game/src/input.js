// Keyboard and pointer input. Arrow keys move a crosshair reticle over the pictures;
// Enter or Space marks where it stands. Clicks and taps mark directly. One-shot presses
// (start, pause, hint, mute) are queued as bit flags and taken once by the loop, so a press
// between two frames is never lost and never counted twice.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_MUTE = 8;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const HINT = new Set(['KeyH']);
const MUTE = new Set(['KeyM']);

export function createInput(canvas) {
  let actions = 0;
  // The reticle starts over the left picture, where the first difference hides.
  const reticle = { x: 300, y: 260, visible: false, panel: 0 };
  let pointer = null; // { x, y, panel } in logical coordinates, set by a pointerdown
  let lastPointer = null; // last pointer position, for hover on buttons

  // The renderer scales the 1280x720 field to the window with letterboxing; undo that
  // same transform so a pointer lands on the logical point it looks like it lands on.
  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / 1280, rect.height / 720);
    const offsetX = (rect.width - 1280 * scale) / 2;
    const offsetY = (rect.height - 720 * scale) / 2;
    return {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      reticle.x = Math.max(0, reticle.x - (event.shiftKey ? 40 : 14));
      reticle.visible = true;
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      reticle.x = Math.max(0, reticle.x + (event.shiftKey ? 40 : 14));
      reticle.visible = true;
    } else if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      reticle.y = Math.max(0, reticle.y - (event.shiftKey ? 40 : 14));
      reticle.visible = true;
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      reticle.y = Math.max(0, reticle.y + (event.shiftKey ? 40 : 14));
      reticle.visible = true;
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (HINT.has(event.code)) {
      if (!event.repeat) actions |= ACTION_HINT;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else {
      return;
    }
    event.preventDefault();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toLogical(event);
    pointer = point;
    lastPointer = point;
    reticle.x = point.x;
    reticle.y = point.y;
  });
  canvas.addEventListener('pointermove', (event) => {
    lastPointer = toLogical(event);
  });

  // A key released while the tab is hidden never sends keyup: nothing held here needs it.

  return {
    reticle,
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The last pointerdown, in logical coordinates, or null; consumed on read. */
    takePointer() {
      const taken = pointer;
      pointer = null;
      return taken;
    },
    /** The last pointer position, for hover highlights; null before any pointer. */
    hover() {
      return lastPointer;
    },
  };
}
