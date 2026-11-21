// All sound is synthesized with WebAudio: no audio files, nothing fetched. A tiny note
// helper plays short tones; a soft music loop plucks a slow pentatonic melody over a pad.
// Audio starts only after the first user gesture, as browsers require.

const NOTES = {
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5,
};

/** A slow, calm melody the loop walks through, one note every two beats. */
const MELODY = ['E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'C5', 'A4', 'C5', 'D5', 'E5', 'G5', 'E5'];
const PAD_CHORDS = [['C4', 'E4', 'G4'], ['A4', 'C5', 'E5'], ['G4', 'C5', 'E5'], ['C4', 'G4', 'C5']];

export function createAudio() {
  let context = null;
  let master = null;
  let musicOn = true;
  let musicTimer = null;
  let melodyStep = 0;
  let chordStep = 0;

  function ensure() {
    if (context) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.5;
      master.connect(context.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(frequency, startAt, duration, type, volume, slideTo) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, startAt + duration);
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(volume, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.05);
  }

  /** Play a short sequence of named notes, each [note, delaySeconds, seconds, type, volume]. */
  function playSequence(notes) {
    if (!ensure() || context.state === 'suspended') return;
    const now = context.currentTime;
    for (const [name, delay, duration, type, volume] of notes) {
      tone(NOTES[name], now + delay, duration, type, volume);
    }
  }

  function startMusic() {
    if (!ensure() || musicTimer !== null) return;
    musicTimer = window.setInterval(() => {
      if (!musicOn || context.state === 'suspended') return;
      const now = context.currentTime;
      const chord = PAD_CHORDS[chordStep % PAD_CHORDS.length];
      chordStep += 1;
      for (const name of chord) tone(NOTES[name], now, 3.6, 'sine', 0.035);
      const note = MELODY[melodyStep % MELODY.length];
      melodyStep += 1;
      tone(NOTES[note], now + 0.05, 1.4, 'triangle', 0.07);
      tone(NOTES[note] * 2, now + 0.05, 0.9, 'sine', 0.02);
    }, 1800);
  }

  return {
    /** Call from any user gesture so the browser lets audio start. */
    unlock() {
      if (ensure() && context.state === 'suspended') context.resume().catch(() => {});
      startMusic();
    },
    found() {
      playSequence([
        ['E5', 0, 0.18, 'sine', 0.22],
        ['G5', 0.07, 0.22, 'sine', 0.22],
        ['C6', 0.14, 0.35, 'sine', 0.2],
      ]);
    },
    wrong() {
      if (!ensure() || context.state === 'suspended') return;
      tone(140, context.currentTime, 0.22, 'sawtooth', 0.08, 90);
    },
    hint() {
      playSequence([
        ['A5', 0, 0.25, 'sine', 0.14],
        ['E5', 0.09, 0.3, 'sine', 0.12],
      ]);
    },
    click() {
      playSequence([['G4', 0, 0.07, 'triangle', 0.1]]);
    },
    roundWin() {
      playSequence([
        ['C5', 0, 0.2, 'triangle', 0.18],
        ['E5', 0.1, 0.2, 'triangle', 0.18],
        ['G5', 0.2, 0.2, 'triangle', 0.18],
        ['C6', 0.3, 0.5, 'triangle', 0.2],
      ]);
    },
    gameWin() {
      playSequence([
        ['C5', 0, 0.2, 'triangle', 0.18],
        ['E5', 0.12, 0.2, 'triangle', 0.18],
        ['G5', 0.24, 0.2, 'triangle', 0.18],
        ['C6', 0.36, 0.3, 'triangle', 0.2],
        ['E6', 0.5, 0.6, 'triangle', 0.18],
      ]);
    },
    tick() {
      playSequence([['C5', 0, 0.06, 'square', 0.05]]);
    },
    /** True when music is playing; toggled by the M key and the music button. */
    toggleMusic() {
      musicOn = !musicOn;
      return musicOn;
    },
    get musicOn() {
      return musicOn;
    },
  };
}
