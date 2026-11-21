// The three scenes, each drawn from scratch in canvas 2D. A scene's draw() paints the picture
// once; a Set of "applied" difference ids switches the changed variant of each difference, so
// the left panel (no differences applied) and the right panel (all seven applied) are the two
// near-identical pictures. Every difference also carries the point a click must land near.
//
// Coordinates are in panel space: 604 wide, 512 tall. The seeded random only places
// decoration (stars, pebbles, flowers) so both panels agree exactly.

import { createRandom } from './random.js';

// --- small drawing helpers -------------------------------------------------

function circle(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function rect(ctx, x, y, width, height, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
}

function poly(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function star(ctx, x, y, radius, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function cloud(ctx, x, y, scale, fill) {
  ctx.fillStyle = fill;
  circle(ctx, x, y, 22 * scale, fill);
  circle(ctx, x + 22 * scale, y - 8 * scale, 18 * scale, fill);
  circle(ctx, x + 44 * scale, y, 20 * scale, fill);
  circle(ctx, x + 22 * scale, y + 6 * scale, 20 * scale, fill);
}

function gull(ctx, x, y, scale, colour) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2.5 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 12 * scale, y);
  ctx.quadraticCurveTo(x - 5 * scale, y - 9 * scale, x, y);
  ctx.quadraticCurveTo(x + 5 * scale, y - 9 * scale, x + 12 * scale, y);
  ctx.stroke();
}

function verticalGradient(ctx, stops, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  for (const [at, colour] of stops) gradient.addColorStop(at, colour);
  return gradient;
}

// --- Scene 1: The Lighthouse Keeper's Morning ------------------------------

export const LIGHTHOUSE_DIFFERENCES = [
  { id: 'sun-glasses', x: 500, y: 72, r: 30, label: 'the sun wears sunglasses' },
  { id: 'stripe', x: 150, y: 330, r: 30, label: 'a stripe on the lighthouse' },
  { id: 'sail', x: 264, y: 368, r: 30, label: 'the colour of the boat sail' },
  { id: 'gull', x: 332, y: 138, r: 22, label: 'a gull in the sky' },
  { id: 'window', x: 470, y: 428, r: 22, label: 'the cottage window' },
  { id: 'flag', x: 168, y: 168, r: 25, label: 'the flag on the lighthouse' },
  { id: 'crab', x: 545, y: 472, r: 24, label: 'a crab on the rocks' },
];

function drawLighthouse(ctx, applied, seed, time) {
  const random = createRandom(seed);
  // Sky and sea.
  ctx.fillStyle = verticalGradient(ctx, [[0, '#8ec9ee'], [0.55, '#cfe9f7'], [1, '#eaf6fd']], 512);
  ctx.fillRect(0, 0, 604, 512);
  // Sun (with or without sunglasses).
  circle(ctx, 500, 72, 38, '#ffd93b');
  ctx.strokeStyle = '#f5b301';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(500 + Math.cos(a) * 46, 72 + Math.sin(a) * 46);
    ctx.lineTo(500 + Math.cos(a) * 56, 72 + Math.sin(a) * 56);
    ctx.stroke();
  }
  circle(ctx, 500, 72, 38, '#ffd93b');
  if (applied.has('sun-glasses')) {
    ctx.fillStyle = '#22242e';
    ctx.beginPath();
    ctx.roundRect(476, 62, 20, 13, 5);
    ctx.roundRect(504, 62, 20, 13, 5);
    ctx.fill();
    ctx.strokeStyle = '#22242e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(496, 68);
    ctx.lineTo(504, 68);
    ctx.stroke();
  } else {
    circle(ctx, 488, 66, 3.5, '#33302a');
    circle(ctx, 512, 66, 3.5, '#33302a');
    ctx.strokeStyle = '#33302a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(500, 76, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  // Clouds.
  cloud(ctx, 96, 66, 1.0, 'rgba(255,255,255,0.95)');
  cloud(ctx, 292, 44, 0.8, 'rgba(255,255,255,0.9)');
  cloud(ctx, 420, 122, 0.65, 'rgba(255,255,255,0.85)');
  // Gulls (the third is missing on the right picture).
  gull(ctx, 92, 122, 1, '#3a4a5a');
  gull(ctx, 202, 92, 0.9, '#3a4a5a');
  if (!applied.has('gull')) gull(ctx, 332, 138, 1, '#3a4a5a');
  // Distant hills and sea.
  ctx.fillStyle = '#7fb069';
  ctx.beginPath();
  ctx.moveTo(0, 300);
  ctx.quadraticCurveTo(140, 262, 300, 296);
  ctx.quadraticCurveTo(460, 326, 604, 288);
  ctx.lineTo(604, 340);
  ctx.lineTo(0, 340);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = verticalGradient(ctx, [[0, '#4aa3d8'], [1, '#1f6fb2']], 512);
  ctx.fillRect(0, 320, 604, 192);
  // Waves.
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let row = 0; row < 4; row += 1) {
    for (let i = 0; i < 5; i += 1) {
      const wx = 40 + i * 120 + row * 30;
      const wy = 348 + row * 34 + Math.sin(time * 1.4 + row * 2 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 14, wy - 7, wx + 28, wy);
      ctx.stroke();
    }
  }
  // Boat (sail red on the left, teal on the right), out on the open water.
  const sail = applied.has('sail') ? '#2a9d8f' : '#e63946';
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.moveTo(228, 392);
  ctx.lineTo(300, 392);
  ctx.lineTo(286, 410);
  ctx.lineTo(242, 410);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a3413';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(264, 392);
  ctx.lineTo(264, 332);
  ctx.stroke();
  poly(ctx, [[264, 336], [264, 388], [298, 388]], sail);
  poly(ctx, [[260, 344], [260, 388], [234, 388]], '#f4f1de');
  // Buoy.
  circle(ctx, 96, 428, 13, '#ff6b35');
  rect(ctx, 83, 414, 26, 8, '#ffffff');
  ctx.fillStyle = '#333';
  ctx.fillRect(94, 404, 4, 10);
  // Rocky shore.
  ctx.fillStyle = '#8d99ae';
  ctx.beginPath();
  ctx.moveTo(0, 452);
  ctx.quadraticCurveTo(120, 428, 260, 452);
  ctx.quadraticCurveTo(420, 474, 604, 448);
  ctx.lineTo(604, 512);
  ctx.lineTo(0, 512);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6c7a8c';
  for (let i = 0; i < 14; i += 1) {
    const px = random() * 604;
    const py = 458 + random() * 48;
    ellipse(ctx, px, py, 8 + random() * 14, 5 + random() * 6, i % 2 ? '#7d8b9e' : '#97a3b5');
  }
  // Grass tufts.
  ctx.strokeStyle = '#5b8c5a';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 12; i += 1) {
    const gx = 20 + random() * 560;
    const gy = 452 + random() * 46;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx - 4, gy - 10);
    ctx.moveTo(gx + 3, gy);
    ctx.lineTo(gx + 5, gy - 11);
    ctx.stroke();
  }
  // Flowers.
  for (let i = 0; i < 6; i += 1) {
    const fx = 30 + random() * 540;
    const fy = 470 + random() * 32;
    circle(ctx, fx, fy, 4, ['#ff8fa3', '#ffd166', '#c77dff'][i % 3]);
    circle(ctx, fx, fy - 2, 1.8, '#fff');
  }
  // Lighthouse tower (the middle stripe vanishes on the right picture).
  const towerTop = 178;
  const towerBottom = 462;
  ctx.fillStyle = '#f8f9fa';
  ctx.beginPath();
  ctx.moveTo(118, towerBottom);
  ctx.lineTo(132, towerTop);
  ctx.lineTo(168, towerTop);
  ctx.lineTo(182, towerBottom);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e63946';
  const stripeY = [238, 330];
  for (const y of stripeY) {
    if (y === 330 && applied.has('stripe')) continue;
    const half = 16 + ((y - towerTop) / (towerBottom - towerTop)) * 16;
    ctx.beginPath();
    ctx.moveTo(150 - half, y - 18);
    ctx.lineTo(150 + half, y - 18);
    ctx.lineTo(150 + half + 3, y + 18);
    ctx.lineTo(150 - half - 3, y + 18);
    ctx.closePath();
    ctx.fill();
  }
  // Gallery, lamp room and flag.
  rect(ctx, 122, 168, 56, 12, '#2b2d42');
  circle(ctx, 150, 152, 20, '#ffd93b');
  ctx.strokeStyle = '#2b2d42';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(150, 152, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(150, 132);
  ctx.lineTo(150, 112);
  ctx.stroke();
  const flutter = Math.sin(time * 3) * 3;
  ctx.fillStyle = applied.has('flag') ? '#2a9d8f' : '#e63946';
  if (applied.has('flag')) {
    poly(ctx, [[150, 112], [122, 118 + flutter], [150, 128]], ctx.fillStyle);
  } else {
    poly(ctx, [[150, 112], [178, 118 + flutter], [150, 128]], ctx.fillStyle);
  }
  // Door and windows on the tower.
  ctx.fillStyle = '#2b2d42';
  ctx.beginPath();
  ctx.arc(150, 430, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(138, 430, 24, 32);
  circle(ctx, 150, 392, 7, '#2b2d42');
  // Cottage (window lit on the left, dark on the right).
  ctx.fillStyle = '#f4e1c1';
  ctx.fillRect(392, 408, 148, 54);
  poly(ctx, [[382, 410], [467, 356], [552, 410]], '#c05621');
  ctx.fillStyle = '#8d3b13';
  ctx.fillRect(516, 366, 16, 34);
  rect(ctx, 404, 424, 26, 38, '#6d4c41');
  circle(ctx, 426, 443, 2.5, '#ffd93b');
  rect(ctx, 464, 420, 24, 24, applied.has('window') ? '#3a4a5a' : '#ffd93b');
  ctx.strokeStyle = '#6d4c41';
  ctx.lineWidth = 2;
  ctx.strokeRect(464, 420, 24, 24);
  ctx.beginPath();
  ctx.moveTo(476, 420);
  ctx.lineTo(476, 444);
  ctx.moveTo(464, 432);
  ctx.lineTo(488, 432);
  ctx.stroke();
  // Crab on the rocks (missing on the right picture).
  if (!applied.has('crab')) {
    ctx.fillStyle = '#ff6b35';
    ellipse(ctx, 545, 472, 12, 8, '#ff6b35');
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 2.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(545 + side * 10, 470);
      ctx.lineTo(545 + side * 18, 462);
      ctx.moveTo(545 + side * 10, 474);
      ctx.lineTo(545 + side * 18, 480);
      ctx.stroke();
    }
    circle(ctx, 540, 464, 2.5, '#222');
    circle(ctx, 550, 464, 2.5, '#222');
  }
}

// --- Scene 2: Night Market on Lantern Lane ---------------------------------

export const MARKET_DIFFERENCES = [
  { id: 'moon', x: 92, y: 72, r: 30, label: 'the moon in the sky' },
  { id: 'lantern', x: 302, y: 96, r: 24, label: 'a hanging lantern' },
  { id: 'bulb', x: 520, y: 56, r: 18, label: 'a bulb on the string lights' },
  { id: 'hat', x: 172, y: 252, r: 26, label: "the vendor's hat" },
  { id: 'dumplings', x: 140, y: 336, r: 24, label: 'the dumpling stack' },
  { id: 'sign', x: 432, y: 302, r: 24, label: 'the sign on the tea stall' },
  { id: 'cat', x: 452, y: 204, r: 26, label: 'a cat on the stall roof' },
];

function lantern(ctx, x, y, colour, glow) {
  if (glow) {
    const radial = ctx.createRadialGradient(x, y, 4, x, y, 46);
    radial.addColorStop(0, 'rgba(255, 190, 80, 0.45)');
    radial.addColorStop(1, 'rgba(255, 190, 80, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(x - 46, y - 46, 92, 92);
  }
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x, y, 15, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 13, y - 8);
  ctx.quadraticCurveTo(x, y - 2, x - 13, y + 8);
  ctx.moveTo(x + 13, y - 8);
  ctx.quadraticCurveTo(x, y - 2, x + 13, y + 8);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x - 5, y - 23, 10, 5);
  ctx.fillRect(x - 5, y + 18, 10, 5);
}

function drawMarket(ctx, applied, seed, time) {
  const random = createRandom(seed);
  // Night sky.
  ctx.fillStyle = verticalGradient(ctx, [[0, '#1b1740'], [0.6, '#3b2a63'], [1, '#5b3a7a']], 512);
  ctx.fillRect(0, 0, 604, 512);
  // Stars.
  for (let i = 0; i < 46; i += 1) {
    const sx = random() * 604;
    const sy = random() * 210;
    const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + i * 1.7);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + 0.55 * twinkle})`;
    circle(ctx, sx, sy, 1 + random() * 1.4, ctx.fillStyle);
  }
  // Moon (full on the left, crescent on the right).
  circle(ctx, 92, 72, 30, '#f4ead5');
  ctx.fillStyle = '#d9c9a8';
  circle(ctx, 82, 64, 6, '#d9c9a8');
  circle(ctx, 100, 80, 4, '#d9c9a8');
  if (applied.has('moon')) {
    circle(ctx, 104, 64, 26, '#3b2a63');
  }
  // String lights across the top.
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 28);
  ctx.quadraticCurveTo(302, 66, 604, 28);
  ctx.stroke();
  const bulbXs = [52, 130, 208, 286, 364, 442, 520];
  for (const bx of bulbXs) {
    // The bulb hangs from the same quadratic curve as the wire above.
    const t = bx / 604;
    const by = (1 - t) * (1 - t) * 28 + 2 * (1 - t) * t * 66 + t * t * 28;
    const sway = Math.sin(time * 1.2 + bx) * 1.5;
    ctx.strokeStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(bx, by - 8);
    ctx.lineTo(bx + sway, by);
    ctx.stroke();
    if (bx === 520 && applied.has('bulb')) continue;
    circle(ctx, bx + sway, by + 6, 6, '#ffd166');
    ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
    circle(ctx, bx + sway, by + 6, 12, ctx.fillStyle);
  }
  // Hanging paper lanterns.
  lantern(ctx, 150, 96, '#e63946', true);
  lantern(ctx, 302, 96, applied.has('lantern') ? '#ffd166' : '#e63946', true);
  lantern(ctx, 454, 96, '#e63946', true);
  // Street.
  ctx.fillStyle = '#2c2140';
  ctx.fillRect(0, 388, 604, 124);
  ctx.fillStyle = '#3a2d55';
  for (let i = 0; i < 9; i += 1) {
    ellipse(ctx, 40 + i * 66, 470 + (i % 2) * 24, 26, 5, '#3a2d55');
  }
  // Left stall: dumplings.
  ctx.fillStyle = '#7a3b2e';
  poly(ctx, [[58, 250], [150, 226], [242, 250]], '#8d4a3a');
  ctx.fillStyle = '#f4e1c1';
  ctx.fillRect(66, 250, 168, 10);
  ctx.fillStyle = '#5b2d26';
  ctx.fillRect(70, 260, 8, 128);
  ctx.fillRect(222, 260, 8, 128);
  ctx.fillStyle = '#8d4a3a';
  ctx.fillRect(66, 330, 168, 58);
  ctx.fillStyle = '#f7ead7';
  ctx.fillRect(66, 330, 168, 8);
  // Dumpling stack (four on the left, three on the right).
  const dumplings = applied.has('dumplings') ? 3 : 4;
  for (let i = 0; i < dumplings; i += 1) {
    const dx = 118 + i * 16;
    const dy = 322 - (i % 2) * 8;
    ellipse(ctx, dx, dy, 11, 8, '#fff3e0');
    ctx.strokeStyle = '#d9a05b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(dx, dy, 11, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Bowls and jars on the counter.
  circle(ctx, 196, 318, 10, '#2a9d8f');
  circle(ctx, 216, 320, 8, '#e63946');
  // Vendor behind the stall (straw hat on the left, red cap on the right).
  circle(ctx, 172, 218, 20, '#f2c9a0');
  ctx.fillStyle = '#3a2d55';
  ctx.beginPath();
  ctx.arc(172, 218, 20, 0, Math.PI);
  ctx.fill();
  if (applied.has('hat')) {
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.arc(172, 204, 16, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(156, 200, 32, 6);
  } else {
    ctx.fillStyle = '#e9c46a';
    ctx.beginPath();
    ctx.ellipse(172, 202, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(172, 196, 20, 12, 0, Math.PI, 0);
    ctx.fill();
  }
  circle(ctx, 164, 216, 2.5, '#222');
  circle(ctx, 180, 216, 2.5, '#222');
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(172, 226, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#4a7c59';
  ctx.beginPath();
  ctx.moveTo(138, 262);
  ctx.quadraticCurveTo(172, 238, 206, 262);
  ctx.lineTo(206, 268);
  ctx.lineTo(138, 268);
  ctx.closePath();
  ctx.fill();
  // Right stall: tea.
  ctx.fillStyle = '#2a5d8a';
  poly(ctx, [[330, 250], [440, 226], [550, 250]], '#356b9c');
  ctx.fillStyle = '#f4e1c1';
  ctx.fillRect(338, 250, 204, 10);
  ctx.fillStyle = '#1d4258';
  ctx.fillRect(342, 260, 8, 128);
  ctx.fillRect(530, 260, 8, 128);
  ctx.fillStyle = '#2a5d8a';
  ctx.fillRect(338, 330, 204, 58);
  ctx.fillStyle = '#f7ead7';
  ctx.fillRect(338, 330, 204, 8);
  // Teapot and cups.
  ctx.fillStyle = '#c77dff';
  ellipse(ctx, 400, 316, 16, 12, '#c77dff');
  ctx.fillRect(412, 306, 10, 6);
  ctx.strokeStyle = '#c77dff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(384, 312, 8, Math.PI * 0.6, Math.PI * 1.5);
  ctx.stroke();
  circle(ctx, 440, 320, 8, '#f4f1de');
  circle(ctx, 462, 320, 8, '#f4f1de');
  // Stall sign (moon on the left, star on the right).
  ctx.fillStyle = '#f4e1c1';
  ctx.beginPath();
  ctx.roundRect(404, 282, 56, 40, 6);
  ctx.fill();
  ctx.strokeStyle = '#8d4a3a';
  ctx.lineWidth = 2;
  ctx.strokeRect(404, 282, 56, 40);
  if (applied.has('sign')) {
    star(ctx, 432, 302, 12, '#e8a93d');
  } else {
    ctx.fillStyle = '#e8a93d';
    ctx.beginPath();
    ctx.arc(432, 302, 11, Math.PI * 0.55, Math.PI * 1.5);
    ctx.closePath();
    ctx.fill();
  }
  // Cat on the roof (missing on the right picture).
  if (!applied.has('cat')) {
    ctx.fillStyle = '#2b2d42';
    ellipse(ctx, 452, 210, 26, 12, '#2b2d42');
    circle(ctx, 474, 200, 10, '#2b2d42');
    poly(ctx, [[468, 193], [471, 184], [475, 193]], '#2b2d42');
    poly(ctx, [[476, 192], [480, 183], [483, 192]], '#2b2d42');
    ctx.strokeStyle = '#2b2d42';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(428, 212);
    ctx.quadraticCurveTo(416, 200, 424, 190);
    ctx.stroke();
  }
  // Paper scraps and a puddle on the street.
  ctx.fillStyle = '#f4e1c1';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(280 + random() * 260, 420 + random() * 70, 8, 5);
  }
  ellipse(ctx, 300, 470, 60, 10, 'rgba(90, 140, 200, 0.35)');
}

// --- Scene 3: The Mountain Observatory -------------------------------------

export const OBSERVATORY_DIFFERENCES = [
  { id: 'telescope', x: 302, y: 208, r: 30, label: 'where the telescope points' },
  { id: 'star', x: 482, y: 82, r: 20, label: 'a bright star' },
  { id: 'dome-stripe', x: 302, y: 262, r: 30, label: 'the stripe on the dome' },
  { id: 'dome-light', x: 302, y: 306, r: 24, label: 'the light in the dome window' },
  { id: 'comet', x: 500, y: 152, r: 26, label: 'a comet in the sky' },
  { id: 'mug', x: 432, y: 428, r: 22, label: "the astronomer's mug" },
  { id: 'pine', x: 92, y: 422, r: 26, label: 'a pine tree' },
];

function pine(ctx, x, y, scale, colour) {
  ctx.fillStyle = '#5b3a29';
  ctx.fillRect(x - 3 * scale, y - 6 * scale, 6 * scale, 14 * scale);
  ctx.fillStyle = colour;
  for (let i = 0; i < 3; i += 1) {
    const w = (34 - i * 9) * scale;
    const ty = y - 10 * scale - i * 18 * scale;
    poly(ctx, [[x - w / 2, ty], [x + w / 2, ty], [x, ty - 24 * scale]], colour);
  }
}

function drawObservatory(ctx, applied, seed, time) {
  const random = createRandom(seed);
  // Dusk sky.
  ctx.fillStyle = verticalGradient(ctx, [[0, '#141b3d'], [0.55, '#3b2a63'], [0.8, '#c96f4a'], [1, '#e8a35c']], 512);
  ctx.fillRect(0, 0, 604, 512);
  // Stars.
  for (let i = 0; i < 60; i += 1) {
    const sx = random() * 604;
    const sy = random() * 240;
    const twinkle = 0.5 + 0.5 * Math.sin(time * 1.8 + i * 2.3);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + 0.6 * twinkle})`;
    circle(ctx, sx, sy, 1 + random() * 1.3, ctx.fillStyle);
  }
  // One bright star (missing on the right picture).
  if (!applied.has('star')) star(ctx, 482, 82, 10, '#fff3b0');
  // Comet (missing on the right picture).
  if (!applied.has('comet')) {
    const gradient = ctx.createLinearGradient(500, 152, 430, 118);
    gradient.addColorStop(0, 'rgba(255, 243, 176, 0.9)');
    gradient.addColorStop(1, 'rgba(255, 243, 176, 0)');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(500, 152);
    ctx.lineTo(428, 116);
    ctx.stroke();
    star(ctx, 500, 152, 9, '#fff3b0');
  }
  // Moon.
  circle(ctx, 96, 84, 24, '#f4ead5');
  ctx.fillStyle = '#d9c9a8';
  circle(ctx, 88, 78, 5, '#d9c9a8');
  circle(ctx, 104, 90, 4, '#d9c9a8');
  // Mountain ridges.
  ctx.fillStyle = '#4a3a6b';
  ctx.beginPath();
  ctx.moveTo(0, 300);
  ctx.lineTo(120, 190);
  ctx.lineTo(220, 300);
  ctx.lineTo(360, 210);
  ctx.lineTo(480, 300);
  ctx.lineTo(604, 220);
  ctx.lineTo(604, 360);
  ctx.lineTo(0, 360);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4f1de';
  poly(ctx, [[104, 204], [120, 190], [138, 206], [126, 214], [112, 210]], '#f4f1de');
  poly(ctx, [[344, 224], [360, 210], [378, 226], [364, 232], [352, 230]], '#f4f1de');
  ctx.fillStyle = '#33294f';
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.quadraticCurveTo(300, 320, 604, 360);
  ctx.lineTo(604, 512);
  ctx.lineTo(0, 512);
  ctx.closePath();
  ctx.fill();
  // Observatory hill and dome.
  ctx.fillStyle = '#2c2140';
  ctx.beginPath();
  ctx.moveTo(180, 400);
  ctx.quadraticCurveTo(302, 330, 424, 400);
  ctx.lineTo(424, 430);
  ctx.lineTo(180, 430);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8e3d3';
  ctx.fillRect(258, 330, 88, 70);
  ctx.beginPath();
  ctx.arc(302, 330, 52, Math.PI, 0);
  ctx.fill();
  // Dome stripe (gold on the left, teal on the right).
  ctx.fillStyle = applied.has('dome-stripe') ? '#2a9d8f' : '#e8a93d';
  ctx.beginPath();
  ctx.arc(302, 330, 52, Math.PI * 1.15, Math.PI * 1.4);
  ctx.lineTo(302, 330);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(302, 330, 52, Math.PI * 1.6, Math.PI * 1.85);
  ctx.lineTo(302, 330);
  ctx.closePath();
  ctx.fill();
  // Dome window (lit on the left, dark on the right).
  ctx.fillStyle = applied.has('dome-light') ? '#3a4a5a' : '#ffd93b';
  ctx.beginPath();
  ctx.arc(302, 306, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(292, 306, 20, 12);
  // Telescope (points up-left on the left, up-right on the right).
  const dir = applied.has('telescope') ? 1 : -1;
  ctx.save();
  ctx.translate(302, 288);
  ctx.rotate(dir * 0.6);
  ctx.fillStyle = '#8d99ae';
  ctx.fillRect(-8, -58, 16, 58);
  ctx.fillStyle = '#e63946';
  ctx.fillRect(-10, -58, 20, 12);
  ctx.fillStyle = '#2b2d42';
  circle(ctx, 0, -60, 9, '#2b2d42');
  ctx.restore();
  // Door.
  ctx.fillStyle = '#2b2d42';
  ctx.beginPath();
  ctx.arc(302, 372, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(292, 372, 20, 28);
  // Pine trees (one extra on the right picture).
  pine(ctx, 150, 430, 1.1, '#2d5a3d');
  pine(ctx, 470, 436, 1.25, '#2d5a3d');
  pine(ctx, 540, 428, 0.9, '#3a6b4a');
  if (applied.has('pine')) pine(ctx, 92, 422, 1.0, '#2d5a3d');
  // Astronomer with a mug (the mug is missing on the right picture).
  ctx.fillStyle = '#f2c9a0';
  circle(ctx, 420, 400, 13, '#f2c9a0');
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.arc(420, 400, 13, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(402, 440);
  ctx.quadraticCurveTo(420, 412, 438, 440);
  ctx.lineTo(438, 452);
  ctx.lineTo(402, 452);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2b2d42';
  ctx.fillRect(408, 452, 8, 22);
  ctx.fillRect(424, 452, 8, 22);
  if (!applied.has('mug')) {
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(436, 424, 10, 12);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(449, 430, 4, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }
  // Fireflies.
  for (let i = 0; i < 8; i += 1) {
    const fx = 60 + random() * 480;
    const fy = 440 + random() * 50;
    const glow = 0.4 + 0.6 * Math.abs(Math.sin(time + i * 1.3));
    ctx.fillStyle = `rgba(255, 243, 176, ${glow})`;
    circle(ctx, fx, fy, 2.5, ctx.fillStyle);
  }
}

// --- Scene registry ----------------------------------------------------------

export const SCENES = {
  lighthouse: { draw: drawLighthouse, differences: LIGHTHOUSE_DIFFERENCES },
  market: { draw: drawMarket, differences: MARKET_DIFFERENCES },
  observatory: { draw: drawObservatory, differences: OBSERVATORY_DIFFERENCES },
};
