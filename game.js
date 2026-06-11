/* ==========================================================================
   PENNY RUNNER — A Very Good Dog Adventure
   A Lode Runner inspired game starring Penny the Cavalier King Charles
   Spaniel. Collect every treat, dodge (or boop) the squirrels, and get
   home for snuggle time. © 1996 GOOD DOG SOFTWARE (in spirit).
   ========================================================================== */
'use strict';

/* ----------------------------- constants ------------------------------ */
const COLS = 28, ROWS = 16, T = 24;          // grid + tile size (px)
const HUD = 48;                              // hud bar height (px)
const W = COLS * T, H = ROWS * T + HUD;      // canvas size

const PENNY_SPEED  = 92;     // px/s walking
const CLIMB_SPEED  = 78;
const FALL_SPEED   = 168;
const SQRL_SPEED   = 64;
const DIG_TIME     = 0.34;   // s, penny locked while digging
const HOLE_LIFE    = 5.2;    // s before a hole refills
const HOLE_WARN    = 4.0;    // s, when refill flicker starts
const TRAP_TIME    = 2.9;    // s a squirrel stays trapped
const DISTRACT_RANGE = 5 * T;
const DISTRACT_FILL  = 0.42; // meter per second near a squirrel
const DISTRACT_DECAY = 0.55;
const DISTRACT_TIME  = 1.35; // s of uncontrollable squirrel-chasing
const FOCUS_TIME     = 4.0;  // s of immunity after shaking it off

const YELLS = ['RADICAL!', 'TUBULAR!', 'PAW-SOME!', 'TOTALLY!', 'WOOF!',
               'BODACIOUS!', 'AS IF!', 'COWABUNGA!', 'YUM!'];

/* ------------------------------- levels --------------------------------
   legend:  # brick (diggable)   = bedrock (solid)   H ladder   - bar
            t treat   s squirrel   P penny start   F family couch
            . empty
   Each map is 16 rows of 28 chars (validated by tools/validate-levels.mjs)
------------------------------------------------------------------------- */
const LEVELS = [
  {
    name: 'LEVEL 1: BACKYARD BASICS',
    tip: 'Grab every treat, then head home to the family!',
    map: [
      '............................',
      '............................',
      '....t................t......',
      '...####H...........H####....',
      '.......H...........H........',
      '.......H..--------.H........',
      '.t.....H...........H..s..t..',
      '####H#####.......#########H#',
      '....H.....................H.',
      '....H........t............H.',
      '....H.....H#####H.........H.',
      '....H.....H.....H.........H.',
      '..t.H.....H..t..H.........H.',
      '#######H##########H#########',
      '.P.....H..........H....t..F.',
      '============================',
    ],
  },
  {
    name: 'LEVEL 2: SQUIRREL PARK',
    tip: 'Squirrels are SO distracting... stay focused, Penny!',
    map: [
      '............................',
      '..t.....................t...',
      '.####H..............H####...',
      '.....H....-------...H.......',
      '.....H..............H.......',
      '..s..H....t....t....H..s....',
      '###H#####H######H#####H#####',
      '...H.....H......H.....H.....',
      '...H..t..H......H..t..H.....',
      '...####H##..tt.H##H####.....',
      '.......H..#####H..H.........',
      '.......H.......H..H.........',
      '..t....H....s..H..H....t....',
      '####H#####################H#',
      '.P..H...t...........t..F..H.',
      '============================',
    ],
  },
  {
    name: 'LEVEL 3: THE BIG DIG',
    tip: 'Press Z / X to dig! Trap squirrels, tunnel to treats.',
    map: [
      '............................',
      '.....t...............t......',
      '..H#####----------#####H....',
      '..H....................H...H',
      '..H...t....s...s....t..H...H',
      '..H#####H##########H###H#..H',
      '........H..t....t..H.......H',
      '........H#########.H.......H',
      '.t......H..........H......t.',
      '###H#######......######H####',
      '...H........................',
      '...H...####H######..........',
      '...H...#...H.....#....s.....',
      '...H...#.t.H..t..#..#####H..',
      '.P.H...###########..F....H..',
      '============================',
    ],
  },
];

/* ------------------------------ pixel art ------------------------------ */
const PAL = {
  // penny is a black & tan cavalier: o outline, c black coat, d/e coat shade, w tan points
  o: '#101016', c: '#34343f', d: '#26262f', w: '#d59247', k: '#15151b',
  p: '#ff8fb2', g: '#7e8498', G: '#555a6a', r: '#a3552c', e: '#22222a',
  y: '#ffd23e', b: '#5ec8e8', m: '#ff4fa3', v: '#7e5bef', n: '#274060',
  s: '#f2c894', h: '#ff6b81',
};

// Penny, facing right. 16 x 12.
const PENNY_RUN = [[
  '..........oooo..',
  '.........occcco.',
  'oo......occcccco',
  '.oo....occeecwco',
  '..ooooooccewwkwo',
  '..occccccceewwwk',
  '.occwwccccesswo.',
  '.ocwwwwccccwwp..',
  '.owwwwwwccoooo..',
  '..owwowwoc......',
  '..ow..ow........',
  '..oo..oo........',
], [
  '..........oooo..',
  '.........occcco.',
  '.oo.....occcccco',
  '..oo...occeecwco',
  '..ooooooccewwkwo',
  '..occccccceewwwk',
  '.occwwccccesswo.',
  '.ocwwwwccccwwp..',
  '.owwwwwwccoooo..',
  '..owwowwoc......',
  '...ow..ow.......',
  '...oo..oo.......',
]];

// Penny climbing (back view). 16 x 12, two frames (paw swap).
const PENNY_CLIMB = [[
  '......oooo......',
  '..o..occcco..o..',
  '..oo.occcco.oo..',
  '...oooccccooo...',
  '....occddcco....',
  '....occddcco....',
  '....occcccco....',
  '....occcccco....',
  '....occcccco....',
  '.....occcco.....',
  '.....ow..wo.....',
  '.....oo..oo.....',
], [
  '......oooo......',
  '..o..occcco..o..',
  '..oo.occcco.oo..',
  '...oooccccooo...',
  '....occddcco....',
  '....occddcco....',
  '....occcccco....',
  '....occcccco....',
  '....occcccco....',
  '.....occcco.....',
  '.....ow.wo......',
  '.....oo.oo......',
]];

// Penny hanging from a bar, facing right. 16 x 12.
const PENNY_HANG = [[
  '..oo......oo....',
  '..oo......oo....',
  '..occccccco.....',
  '.occcccccccoooo.',
  '.occwwcccccccco.',
  '.ocwwwccceeccwwo',
  '.owwwwccceewkwko',
  '..owwwwccewwwwo.',
  '...oooooceewwp..',
  '........oooo....',
  '................',
  '................',
]];

// Penny sitting (snuggle / title). 16 x 13.
const PENNY_SIT = [[
  '......oooo......',
  '.....occcco.....',
  '....occcccco....',
  '...oeccwcwcdo...',
  '...oecwkwkcdo...',
  '...oecwwwwcdo...',
  '....ocwkkwco....',
  '....owsppswo....',
  '...ocwwwwwwco...',
  '..owcwwwwwwco...',
  '..ocwwwwwwwco...',
  '..ow.owwwwo.wo..',
  '..oo.oo..oo.oo..',
]];

// Squirrel, facing left. 14 x 11.
const SQRL = [[
  '..........gg..',
  '.........gGGg.',
  '..g......gGGg.',
  '.ggg.....gGGg.',
  '.gkg....ggGGg.',
  '.gggg..ggGGg..',
  '..ggggggGGgg..',
  '..rrggggGgg...',
  '..rrggggg.....',
  '...gg..gg.....',
  '..gg...gg.....',
], [
  '.........gg...',
  '........gGGg..',
  '..g.....gGGg..',
  '.ggg....gGGg..',
  '.gkg...ggGGg..',
  '.gggg.ggGGg...',
  '..ggggggGGg...',
  '..rrggggGg....',
  '..rrggggg.....',
  '...gg...gg....',
  '....g...g.....',
]];

// Dog biscuit treat. 10 x 7.
const TREAT = [[
  '.oo....oo.',
  'oyyo..oyyo',
  'oyyyyyyyyo',
  '.oyyyyyyo.',
  'oyyyyyyyyo',
  'oyyo..oyyo',
  '.oo....oo.',
]];

// The family on the couch. 24 x 16.
const FAMILY = [[
  '........................',
  '...nn..........nn.......',
  '..ssss........ssss......',
  '..ssks........skss......',
  '..ssss........ssss......',
  'vvvsssvvvvvvvvssssvvv...',
  'vbbsssbbbbbbbbssssbbv...',
  'vbbsssbbbhhbbbssssbbv...',
  'vbbsssbbhhhhbbssssbbv...',
  'vbbsssbbbhhbbbssssbbv...',
  'vbbbbbbbbbbbbbbbbbbbv...',
  'vvvvvvvvvvvvvvvvvvvvv...',
  '.vv.................vv..',
  '.vv.................vv..',
  '........................',
  '........................',
]];

function buildSprite(rows, scale) {
  const c = document.createElement('canvas');
  c.width = rows[0].length * scale;
  c.height = rows.length * scale;
  const g = c.getContext('2d');
  for (let r = 0; r < rows.length; r++) {
    for (let i = 0; i < rows[r].length; i++) {
      const ch = rows[r][i];
      if (ch === '.') continue;
      g.fillStyle = PAL[ch] || '#fff';
      g.fillRect(i * scale, r * scale, scale, scale);
    }
  }
  return c;
}
function flipSprite(img) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.translate(img.width, 0); g.scale(-1, 1);
  g.drawImage(img, 0, 0);
  return c;
}

const SPR = {};
function buildSprites() {
  const s = 1.6;
  SPR.runR   = PENNY_RUN.map(f => buildSprite(f, s));
  SPR.runL   = SPR.runR.map(flipSprite);
  SPR.climb  = PENNY_CLIMB.map(f => buildSprite(f, s));
  SPR.hangR  = PENNY_HANG.map(f => buildSprite(f, s));
  SPR.hangL  = SPR.hangR.map(flipSprite);
  SPR.sit    = buildSprite(PENNY_SIT[0], 2.2);
  SPR.sqrlL  = SQRL.map(f => buildSprite(f, 1.5));
  SPR.sqrlR  = SPR.sqrlL.map(flipSprite);
  SPR.treat  = buildSprite(TREAT[0], 1.6);
  SPR.family = buildSprite(FAMILY[0], 2.0);
}

/* ------------------------------- audio --------------------------------- */
let actx = null, muted = false;
function audio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  return actx;
}
function tone(freq, dur, type = 'square', vol = 0.12, when = 0, slide = 0) {
  const a = audio(); if (!a || muted) return;
  const t0 = a.currentTime + when;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
const SFX = {
  treat:   () => { tone(660, .08); tone(880, .08, 'square', .12, .07); tone(1320, .12, 'square', .12, .14); },
  dig:     () => tone(140, .18, 'sawtooth', .14, 0, -80),
  fill:    () => tone(90, .2, 'sawtooth', .12, 0, 60),
  alert:   () => { tone(1200, .06, 'square', .1); tone(1500, .06, 'square', .1, .07); tone(1200, .06, 'square', .1, .14); },
  boop:    () => tone(520, .1, 'triangle', .16, 0, 300),
  trap:    () => { tone(400, .08, 'square', .1); tone(300, .12, 'square', .1, .08); },
  die:     () => { tone(440, .15, 'square', .14); tone(330, .15, 'square', .14, .15); tone(220, .3, 'square', .14, .3, -100); },
  open:    () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, .12, 'triangle', .12, i * .09)); },
  snuggle: () => { [392, 523, 659, 784, 659, 1046].forEach((f, i) => tone(f, .16, 'triangle', .12, i * .12)); },
  start:   () => { [262, 330, 392, 523].forEach((f, i) => tone(f, .1, 'square', .1, i * .08)); },
};

/* ------------------------------ game state ----------------------------- */
const cv = document.getElementById('game');
cv.width = W; cv.height = H;
const cx = cv.getContext('2d');
cx.imageSmoothingEnabled = false;

let state = 'title';          // title | intro | play | snuggle | dead | gameover | win
let stateT = 0;               // time in current state
let level = 0, score = 0, lives = 3, hiscore = 0;
let grid = [], holes = new Map(), treats = [], squirrels = [];
let penny = null, family = { x: 0, y: 0 };
let exitOpen = false, popups = [], hearts = [], confetti = [];
let levelTime = 0, frame = 0;
try { hiscore = +localStorage.getItem('pennyHi') || 0; } catch (e) {}

const keys = {};
addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  audio();
  if (e.key.toLowerCase() === 'm') muted = !muted;
  if (e.key === 'Enter') {
    if (state === 'title' || state === 'gameover' || state === 'win') startGame();
  }
  if (e.key.toLowerCase() === 'r' && state === 'play') loseLife(true);
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

/* ----------------------------- level setup ----------------------------- */
function key(c, r) { return r * COLS + c; }
function rawTile(c, r) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return '=';
  return grid[r][c];
}
function tile(c, r) {
  const ch = rawTile(c, r);
  if (ch === '#' && holes.has(key(c, r))) return '.';
  return ch;
}
function solid(c, r) { const ch = tile(c, r); return ch === '#' || ch === '='; }

function loadLevel(n) {
  const L = LEVELS[n];
  grid = []; holes.clear(); treats = []; squirrels = [];
  exitOpen = false; popups = []; hearts = []; levelTime = 0;
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      let ch = L.map[r][c];
      if (ch === 't') { treats.push({ c, r, got: false }); ch = '.'; }
      else if (ch === 'P') { penny = makePenny(c, r); ch = '.'; }
      else if (ch === 's') { squirrels.push(makeSquirrel(c, r)); ch = '.'; }
      else if (ch === 'F') { family = { c, r, x: c * T + T / 2, y: r * T + T / 2 }; ch = '.'; }
      row.push(ch);
    }
    grid.push(row);
  }
}

function makePenny(c, r) {
  return {
    x: c * T + T / 2, y: r * T + T / 2, spawnC: c, spawnR: r,
    face: 1, anim: 0, falling: false, onBar: false, climbing: false,
    digT: 0, digDir: 0, distract: 0, distractT: 0, focusT: 0, stunT: 0,
    tailWag: 0,
  };
}
function makeSquirrel(c, r) {
  return {
    x: c * T + T / 2, y: r * T + T / 2, spawnC: c, spawnR: r,
    face: -1, anim: Math.random() * 9, falling: false, climbing: false,
    trapped: 0, scamperT: 0, thinkT: Math.random() * .2, lr: 0, ud: 0,
    carrying: null, outC: 0, outR: 0,
  };
}

function startGame() {
  level = 0; score = 0; lives = 3;
  loadLevel(level);
  setState('intro');
  SFX.start();
}
function setState(s) { state = s; stateT = 0; }

/* ------------------------------ movement ------------------------------- */
function colOf(a) { return Math.floor(a.x / T); }
function rowOf(a) { return Math.floor(a.y / T); }
function center(i) { return i * T + T / 2; }

function supported(a) {
  const c = colOf(a), r = rowOf(a);
  if (a.onBar && tile(c, r) === '-') return true;
  if (tile(c, r) === 'H') return true;
  if (solid(c, r + 1) || tile(c, r + 1) === 'H') {
    return a.y >= center(r) - 1;
  }
  return false;
}

function moveActor(a, lr, ud, speed, dt) {
  const c = colOf(a), r = rowOf(a);
  const here = tile(c, r);

  // --- falling ---
  if (a.falling) {
    a.onBar = false; a.climbing = false;
    // drift x to the column centre so we drop cleanly
    const cc = center(c);
    if (Math.abs(a.x - cc) > 1) a.x += Math.sign(cc - a.x) * Math.min(60 * dt, Math.abs(a.x - cc));
    a.y += FALL_SPEED * dt;
    const nr = rowOf(a);
    const nt = tile(c, nr);
    if (nt === 'H') { a.y = center(nr); a.falling = false; return; }
    if (nt === '-' && a.y >= center(nr) - 2) { a.y = center(nr); a.onBar = true; a.falling = false; return; }
    if (solid(c, nr + 1) && a.y >= center(nr)) { a.y = center(nr); a.falling = false; return; }
    if (nt === '#' || nt === '=') { // fell into a freshly-filled tile? push up
      a.y = center(nr - 1); a.falling = false;
    }
    return;
  }

  // --- start falling? ---
  if (!supported(a)) { a.falling = true; return; }

  // --- climbing on ladders ---
  const onLadder = here === 'H';
  const ladderBelow = tile(c, r + 1) === 'H';
  if (ud !== 0 && (onLadder || (ud > 0 && ladderBelow))) {
    const cc = center(c);
    if (Math.abs(a.x - cc) > 1) { a.x += Math.sign(cc - a.x) * Math.min(speed * dt, Math.abs(a.x - cc)); return; }
    a.climbing = true; a.onBar = false;
    const ny = a.y + ud * CLIMB_SPEED * dt;
    const nr = Math.floor(ny / T);
    if (ud < 0) { // up
      if (tile(c, r) !== 'H' && tile(c, r - 1) !== 'H') return;   // not on a ladder
      if (solid(c, nr)) { a.y = center(r); return; }              // wall above: stay on the rung
      if (tile(c, r) === 'H' && tile(c, nr) !== 'H') {            // climbed past the top rung...
        a.y = center(nr); return;                                 // ...step up and stand on the landing
      }
      a.y = ny;
    } else {      // down
      if (solid(c, nr)) { a.y = center(r); return; }
      a.y = ny;
      if (tile(c, nr) !== 'H' && !solid(c, nr + 1) && tile(c, nr) !== '-') a.falling = true;
      if (tile(c, nr) === '-') { a.y = center(nr); a.onBar = true; a.climbing = false; }
    }
    return;
  }

  // --- drop from a bar ---
  if (a.onBar && ud > 0) { a.onBar = false; a.falling = true; return; }

  // --- walking / hanging traversal ---
  if (lr !== 0) {
    a.face = lr; a.climbing = false;
    const cc2 = center(r);
    if (!a.onBar && Math.abs(a.y - cc2) > 1) a.y += Math.sign(cc2 - a.y) * Math.min(speed * dt, Math.abs(a.y - cc2));
    const nx = a.x + lr * speed * dt;
    const edge = nx + lr * (T * 0.38);
    const ec = Math.floor(edge / T);
    if (ec < 0 || ec >= COLS || solid(ec, r)) {
      a.x = center(c) + lr * (T / 2 - T * 0.39 - 0.5) * 0; // bump the wall: snap near it
      a.x = ec === c ? a.x : (lr > 0 ? (ec * T - T * 0.39) : (ec * T + T + T * 0.39));
      return;
    }
    a.x = nx;
    a.anim += dt * 10;
    const nc = colOf(a);
    if (a.onBar && tile(nc, r) !== '-') {
      // walked off the end of the bar
      if (!supported({ ...a, onBar: false })) { a.onBar = false; a.falling = true; }
      else a.onBar = false;
    }
  } else {
    a.anim = 0;
  }
}

/* ------------------------------- digging ------------------------------- */
function tryDig(dir) {
  const c = colOf(penny), r = rowOf(penny);
  const tc = c + dir, tr = r + 1;
  if (rawTile(tc, tr) !== '#' || holes.has(key(tc, tr))) return;
  if (solid(tc, r) || tile(tc, r) === 'H') return; // blocked above target
  holes.set(key(tc, tr), { t: 0, c: tc, r: tr });
  penny.digT = DIG_TIME; penny.digDir = dir; penny.face = dir;
  SFX.dig();
  puff(tc * T + T / 2, tr * T + T / 2);
}

function updateHoles(dt) {
  for (const [k, h] of [...holes]) {
    h.t += dt;
    if (h.t >= HOLE_LIFE) {
      holes.delete(k);
      SFX.fill();
      // anyone inside?
      if (colOf(penny) === h.c && rowOf(penny) === h.r && state === 'play') loseLife(false);
      for (const s of squirrels) {
        if (colOf(s) === h.c && rowOf(s) === h.r) respawnSquirrel(s);
      }
    }
  }
}

/* ------------------------------ squirrels ------------------------------ */
function respawnSquirrel(s) {
  if (s.carrying) { s.carrying.c = s.spawnC; s.carrying.r = s.spawnR; s.carrying.held = false; s.carrying = null; }
  s.x = center(s.spawnC); s.y = center(s.spawnR);
  s.trapped = 0; s.falling = false; s.climbing = false; s.onBar = false; s.scamperT = 0;
}

function nearestLadderCol(r, fromC, wantDown) {
  // scan for a ladder cell on this row (to climb up) or just below (to climb down)
  let best = -1, bd = 1e9;
  for (let c = 0; c < COLS; c++) {
    const ok = wantDown ? (tile(c, r + 1) === 'H' || (!solid(c, r + 1) && tile(c, r) !== 'H'))
                        : tile(c, r) === 'H';
    if (!ok) continue;
    const d = Math.abs(c - fromC);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

function updateSquirrel(s, dt) {
  s.anim += dt * 8;
  if (s.trapped > 0) {
    s.trapped -= dt;
    if (s.trapped <= 0) {
      // climb out of the hole
      const c = colOf(s), r = rowOf(s);
      if (!solid(c, r - 1)) { s.y = center(r - 1); s.scamperT = 1.2; s.face *= -1; }
      else s.trapped = 0.5;
    }
    return;
  }
  // fell into a hole?
  const c = colOf(s), r = rowOf(s);
  if (holes.has(key(c, r)) && !s.falling && supportedSq(s)) {
    s.trapped = TRAP_TIME;
    award(75, s.x, s.y - 14, 'GOTCHA!');
    SFX.trap();
    if (s.carrying) { s.carrying.c = c; s.carrying.r = r - 1; s.carrying.held = false; s.carrying = null; }
    return;
  }

  s.thinkT -= dt;
  if (s.thinkT <= 0) {
    s.thinkT = 0.18 + Math.random() * 0.1;
    const pc = colOf(penny), pr = rowOf(penny);
    s.lr = 0; s.ud = 0;
    if (s.scamperT > 0) { s.lr = s.face; }
    else if (Math.random() < 0.06) { s.lr = Math.random() < 0.5 ? -1 : 1; } // squirrel brain
    else if (pr < r && tile(c, r) === 'H' && !solid(c, r - 1)) s.ud = -1;
    else if (pr > r && (tile(c, r + 1) === 'H' || (tile(c, r) === 'H' && !solid(c, r + 1)))) s.ud = 1;
    else if (pr === r) s.lr = Math.sign(penny.x - s.x) || 1;
    else {
      const lc = nearestLadderCol(r, c, pr > r);
      if (lc >= 0 && lc !== c) s.lr = Math.sign(lc - c);
      else if (lc === c) s.ud = pr > r ? 1 : -1;
      else s.lr = Math.sign(penny.x - s.x) || 1;
    }
  }
  if (s.scamperT > 0) s.scamperT -= dt;

  const speed = s.scamperT > 0 ? SQRL_SPEED * 1.9 : SQRL_SPEED;
  const ox = s.x;
  moveActor(s, s.lr, s.ud, speed, dt);
  if (s.lr !== 0 && Math.abs(s.x - ox) < 0.01 && !s.falling) s.face *= -1; // bonked a wall

  // pick up treats it scurries over (sneaky!)
  if (!s.carrying && !s.falling) {
    for (const t of treats) {
      if (!t.got && !t.held && t.c === colOf(s) && t.r === rowOf(s) && Math.random() < 0.02) {
        t.held = true; s.carrying = t;
        award(0, s.x, s.y - 14, 'HEY! MY TREAT!');
      }
    }
  }
}
function supportedSq(s) { return solid(colOf(s), rowOf(s) + 1) || tile(colOf(s), rowOf(s)) === 'H'; }

/* ------------------------------ fx helpers ----------------------------- */
function award(pts, x, y, txt) {
  if (pts) score += pts;
  popups.push({ x, y, t: 0, txt: txt || `+${pts}` });
}
function puff(x, y) {
  for (let i = 0; i < 6; i++) {
    confetti.push({ x, y, vx: (Math.random() - .5) * 80, vy: -Math.random() * 60, t: 0, life: .5, col: '#caa', sz: 3 });
  }
}
function heartBurst(x, y, n) {
  for (let i = 0; i < n; i++) {
    hearts.push({ x: x + (Math.random() - .5) * 40, y, vy: -30 - Math.random() * 40, t: 0, life: 1.6 + Math.random() });
  }
}

/* ------------------------------ life cycle ----------------------------- */
function loseLife(voluntary) {
  lives--;
  SFX.die();
  award(0, penny.x, penny.y - 18, voluntary ? 'ZOOMIES RESET!' : 'OH NO!');
  if (lives <= 0) {
    if (score > hiscore) { hiscore = score; try { localStorage.setItem('pennyHi', hiscore); } catch (e) {} }
    setState('gameover');
  } else {
    setState('dead');
  }
}
function respawnPenny() {
  penny.x = center(penny.spawnC); penny.y = center(penny.spawnR);
  penny.falling = false; penny.onBar = false; penny.climbing = false;
  penny.distract = 0; penny.distractT = 0; penny.focusT = 2; penny.stunT = 0;
  for (const s of squirrels) respawnSquirrel(s);
}

/* -------------------------------- update ------------------------------- */
function nearestSquirrel() {
  let best = null, bd = 1e9;
  for (const s of squirrels) {
    if (s.trapped > 0) continue;
    const d = Math.hypot(s.x - penny.x, s.y - penny.y);
    if (d < bd) { bd = d; best = s; }
  }
  return { s: best, d: bd };
}

function updatePlay(dt) {
  levelTime += dt;
  updateHoles(dt);

  // --- distraction meter ---
  const { s: nearSq, d } = nearestSquirrel();
  if (penny.distractT > 0) {
    penny.distractT -= dt;
    if (penny.distractT <= 0) {
      penny.focusT = FOCUS_TIME;
      award(0, penny.x, penny.y - 20, 'GOOD GIRL!');
    }
  } else if (penny.focusT > 0) {
    penny.focusT -= dt;
  } else if (nearSq && d < DISTRACT_RANGE && Math.abs(nearSq.y - penny.y) < T * 1.5) {
    penny.distract += DISTRACT_FILL * dt * (1.5 - d / DISTRACT_RANGE);
    if (penny.distract >= 1) {
      penny.distract = 0; penny.distractT = DISTRACT_TIME;
      award(0, penny.x, penny.y - 20, 'SQUIRREL!!');
      SFX.alert();
    }
  } else {
    penny.distract = Math.max(0, penny.distract - DISTRACT_DECAY * dt);
  }

  // --- penny input / movement ---
  let lr = 0, ud = 0;
  if (penny.stunT > 0) penny.stunT -= dt;
  else if (penny.distractT > 0 && nearSq) {
    lr = Math.sign(nearSq.x - penny.x) || penny.face;   // must. chase. squirrel.
  } else if (penny.digT <= 0) {
    if (keys['arrowleft'] || keys['a']) lr = -1;
    if (keys['arrowright'] || keys['d']) lr = 1;
    if (keys['arrowup'] || keys['w']) ud = -1;
    if (keys['arrowdown'] || keys['s']) ud = 1;
    if ((keys['z'] || keys['q']) && !penny.falling && !penny.onBar) { keys['z'] = keys['q'] = false; tryDig(-1); }
    if ((keys['x'] || keys['e']) && !penny.falling && !penny.onBar) { keys['x'] = keys['e'] = false; tryDig(1); }
  }
  if (penny.digT > 0) penny.digT -= dt;
  else {
    const sp = penny.distractT > 0 ? PENNY_SPEED * 1.35 : PENNY_SPEED;
    moveActor(penny, lr, ud, sp, dt);
  }
  penny.tailWag += dt * (lr !== 0 ? 14 : 6);

  // --- squirrels ---
  for (const s of squirrels) updateSquirrel(s, dt);

  // --- boop! ---
  for (const s of squirrels) {
    if (s.trapped > 0 || s.scamperT > 0.5) continue;
    if (Math.abs(s.x - penny.x) < 15 && Math.abs(s.y - penny.y) < 15) {
      s.scamperT = 1.6; s.face = Math.sign(s.x - penny.x) || 1;
      if (s.carrying) { s.carrying.c = colOf(s); s.carrying.r = rowOf(s); s.carrying.held = false; s.carrying = null; }
      penny.distract = 0; penny.distractT = 0; penny.focusT = FOCUS_TIME; penny.stunT = 0.35;
      award(25, penny.x, penny.y - 18, 'BOOP!');
      SFX.boop();
      heartBurst(penny.x, penny.y - 10, 2);
    }
  }

  // --- treats ---
  let left = 0;
  for (const t of treats) {
    if (t.got) continue;
    if (t.held) { left++; continue; }
    left++;
    if (colOf(penny) === t.c && rowOf(penny) === t.r) {
      t.got = true; left--;
      award(100, penny.x, penny.y - 18, Math.random() < 0.3 ? YELLS[(Math.random() * YELLS.length) | 0] : '+100');
      SFX.treat();
    }
  }
  if (left === 0 && !exitOpen) {
    exitOpen = true;
    award(0, family.x, family.y - 30, 'PENNY! DINNER TIME!');
    SFX.open();
  }

  // --- reach the family ---
  if (exitOpen && Math.abs(penny.x - family.x) < T && Math.abs(penny.y - family.y) < T) {
    const bonus = 500 + Math.max(0, 300 - Math.floor(levelTime) * 5);
    score += bonus;
    award(0, family.x, family.y - 36, `SNUGGLE TIME! +${bonus}`);
    SFX.snuggle();
    heartBurst(family.x, family.y - 20, 14);
    setState('snuggle');
  }

  // --- penny squished inside a brick that refilled while she fell etc. ---
  if (rawTile(colOf(penny), rowOf(penny)) === '#' && !holes.has(key(colOf(penny), rowOf(penny)))) {
    loseLife(false);
  }
}

function update(dt) {
  stateT += dt; frame++;
  for (const p of popups) p.t += dt;
  popups = popups.filter(p => p.t < 1.2);
  for (const h of hearts) { h.t += dt; h.y += h.vy * dt; h.vy *= 0.98; }
  hearts = hearts.filter(h => h.t < h.life);
  for (const c of confetti) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 200 * dt; }
  confetti = confetti.filter(c => c.t < c.life);

  switch (state) {
    case 'intro':
      if (stateT > 2.2 || keys['enter']) setState('play');
      break;
    case 'play':
      updatePlay(dt);
      break;
    case 'snuggle':
      if (Math.random() < 0.15) heartBurst(family.x, family.y - 16, 1);
      if (stateT > 3.2) {
        level++;
        if (level >= LEVELS.length) {
          if (score > hiscore) { hiscore = score; try { localStorage.setItem('pennyHi', hiscore); } catch (e) {} }
          setState('win');
        } else {
          loadLevel(level);
          setState('intro');
        }
      }
      break;
    case 'dead':
      if (stateT > 1.4) { respawnPenny(); setState('play'); }
      break;
  }
}

/* -------------------------------- drawing ------------------------------ */
function px(n) { return Math.round(n); }

function chunkyText(txt, x, y, size, fill, align = 'center', shadow = '#1b0b2e') {
  cx.font = `bold ${size}px "Courier New", monospace`;
  cx.textAlign = align; cx.textBaseline = 'middle';
  cx.fillStyle = shadow;
  cx.fillText(txt, x + Math.max(2, size / 9), y + Math.max(2, size / 9));
  cx.fillStyle = fill;
  cx.fillText(txt, x, y);
}
function rainbowText(txt, x, y, size) {
  cx.font = `bold ${size}px "Courier New", monospace`;
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  const grad = cx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  grad.addColorStop(0, '#ffe14d'); grad.addColorStop(0.45, '#ff4fa3');
  grad.addColorStop(0.55, '#7e5bef'); grad.addColorStop(1, '#21d3ee');
  cx.fillStyle = '#1b0b2e';
  cx.fillText(txt, x + 4, y + 4);
  cx.fillStyle = grad;
  cx.fillText(txt, x, y);
}

function drawBG() {
  // bright 90s pastel backdrop — keeps a mostly-black dog visible
  const g = cx.createLinearGradient(0, HUD, 0, H);
  g.addColorStop(0, '#fff3df'); g.addColorStop(0.55, '#ffe2ee'); g.addColorStop(1, '#e3f2ec');
  cx.fillStyle = g;
  cx.fillRect(0, HUD, W, H - HUD);
  cx.strokeStyle = 'rgba(126,91,239,0.12)';
  cx.lineWidth = 1;
  for (let c = 0; c <= COLS; c += 2) {
    cx.beginPath(); cx.moveTo(c * T, HUD); cx.lineTo(c * T, H); cx.stroke();
  }
  for (let r = 0; r <= ROWS; r += 2) {
    cx.beginPath(); cx.moveTo(0, HUD + r * T); cx.lineTo(W, HUD + r * T); cx.stroke();
  }
  // memphis confetti, deterministic
  for (let i = 0; i < 26; i++) {
    const sx = ((i * 97) % COLS) * T + 9, sy = HUD + ((i * 53) % ROWS) * T + 12;
    if (tile(((i * 97) % COLS), ((i * 53) % ROWS)) !== '.') continue;
    cx.save();
    cx.translate(sx, sy);
    cx.globalAlpha = 0.35;
    cx.fillStyle = ['#ff4fa3', '#21d3ee', '#f5a623'][i % 3];
    if (i % 3 === 0) cx.fillRect(-3, -3, 6, 6);
    else if (i % 3 === 1) { cx.beginPath(); cx.arc(0, 0, 3.4, 0, 7); cx.fill(); }
    else { cx.beginPath(); cx.moveTo(0, -4); cx.lineTo(4, 3); cx.lineTo(-4, 3); cx.fill(); }
    cx.restore();
  }
}

function drawTile(c, r) {
  const ch = rawTile(c, r);
  const x = c * T, y = HUD + r * T;
  if (ch === '#') {
    const h = holes.get(key(c, r));
    if (h) {
      // open hole — show dark dirt + refill flicker
      cx.fillStyle = '#160a2c';
      cx.fillRect(x, y, T, T);
      if (h.t > HOLE_WARN && Math.floor(h.t * 10) % 2 === 0) {
        cx.fillStyle = 'rgba(255,79,163,0.5)';
        cx.fillRect(x, y, T, T);
      }
      return;
    }
    cx.fillStyle = '#b03a8c';
    cx.fillRect(x, y, T, T);
    cx.fillStyle = '#d9529f';
    cx.fillRect(x, y, T, 3);
    cx.fillStyle = '#7c2766';
    cx.fillRect(x, y + T - 3, T, 3);
    cx.fillStyle = '#8f2f74';
    cx.fillRect(x, y + 10, T, 2);
    cx.fillRect(x + (r % 2 ? 6 : 16), y + 2, 2, 8);
    cx.fillRect(x + (r % 2 ? 16 : 6), y + 13, 2, 8);
  } else if (ch === '=') {
    cx.fillStyle = '#0e7f8f';
    cx.fillRect(x, y, T, T);
    cx.fillStyle = '#19b3c4';
    cx.fillRect(x, y, T, 3);
    cx.fillStyle = '#085662';
    cx.fillRect(x, y + T - 3, T, 3);
    cx.fillStyle = 'rgba(255,255,255,0.08)';
    if ((c + r) % 2 === 0) cx.fillRect(x, y, T, T);
  } else if (ch === 'H') {
    cx.fillStyle = '#f59f0a';
    cx.fillRect(x + 4, y, 3, T);
    cx.fillRect(x + T - 7, y, 3, T);
    cx.fillRect(x + 4, y + 4, T - 8, 3);
    cx.fillRect(x + 4, y + 15, T - 8, 3);
    cx.fillStyle = '#a86c06';
    cx.fillRect(x + 4, y + 6, T - 8, 1);
    cx.fillRect(x + 4, y + 17, T - 8, 1);
  } else if (ch === '-') {
    cx.fillStyle = '#7d8496';
    cx.fillRect(x, y + 3, T, 3);
    cx.fillStyle = '#535a6c';
    cx.fillRect(x, y + 6, T, 1);
    if (c % 3 === 0) { cx.fillStyle = '#ff4fa3'; cx.fillRect(x + 10, y + 1, 4, 7); } // clothespin
  }
}

function drawPenny() {
  const a = penny;
  let img;
  if (a.onBar) img = a.face > 0 ? SPR.hangR[0] : SPR.hangL[0];
  else if (a.climbing && !a.falling) img = SPR.climb[Math.floor(a.y / 6) % 2];
  else img = (a.face > 0 ? SPR.runR : SPR.runL)[a.anim > 0 ? Math.floor(a.anim) % 2 : 0];
  const bounce = a.falling ? 0 : Math.sin(a.anim * 3) * (a.anim > 0 ? 1.2 : 0);
  const dx = px(a.x - img.width / 2);
  const dy = px(HUD + a.y - img.height + T / 2 - 1 + bounce);
  if (a.stunT > 0 && Math.floor(frame / 3) % 2) return; // blink while stunned
  cx.drawImage(img, dx, dy);

  // distracted thought-bubble
  if (a.distractT > 0) {
    const bx = px(a.x), by = px(HUD + a.y - 34 + Math.sin(stateT * 12) * 2);
    cx.fillStyle = '#fff';
    cx.beginPath(); cx.arc(bx, by, 12, 0, 7); cx.fill();
    cx.beginPath(); cx.arc(bx - 8, by + 11, 3, 0, 7); cx.fill();
    cx.strokeStyle = '#ff4fa3'; cx.lineWidth = 1.5;
    cx.beginPath(); cx.arc(bx, by, 12, 0, 7); cx.stroke();
    cx.drawImage(SPR.sqrlL[0], bx - 9, by - 7, 18, 14);
    chunkyText('!!', bx + 15, by - 4, 13, '#ff4fa3');
  } else if (a.focusT > FOCUS_TIME - 0.8) {
    chunkyText('GOOD GIRL', px(a.x), px(HUD + a.y - 28), 9, '#d61f7f', 'center', '#fff6e8');
  }
  // dig sparkle
  if (a.digT > 0) {
    cx.fillStyle = '#ffe14d';
    const hx = a.x + a.digDir * T * 0.8, hy = HUD + a.y + T * 0.6;
    cx.fillRect(px(hx - 2), px(hy - 2 + Math.sin(frame) * 3), 4, 4);
  }
}

function drawSquirrel(s) {
  const imgArr = s.face < 0 ? SPR.sqrlL : SPR.sqrlR;
  const img = imgArr[Math.floor(s.anim) % 2];
  let dy = HUD + s.y - img.height + T / 2;
  if (s.trapped > 0) dy += 6; // sunk in the hole
  cx.drawImage(img, px(s.x - img.width / 2), px(dy));
  if (s.trapped > 0) chunkyText('!', px(s.x), px(dy - 8), 12, '#ffe14d');
  if (s.carrying) cx.drawImage(SPR.treat, px(s.x - 8), px(dy - 10), 16, 11);
}

function drawTreats() {
  for (const t of treats) {
    if (t.got || t.held) continue;
    const bob = Math.sin(stateT * 4 + t.c) * 1.5;
    cx.drawImage(SPR.treat, px(t.c * T + T / 2 - SPR.treat.width / 2),
                 px(HUD + t.r * T + T - SPR.treat.height - 2 + bob));
  }
}

function drawFamily() {
  const img = SPR.family;
  const x = px(family.x - img.width / 2);
  const y = px(HUD + family.y + T / 2 - img.height);
  cx.drawImage(img, x, y);
  if (exitOpen) {
    const g = Math.sin(stateT * 6) * 0.5 + 0.5;
    cx.fillStyle = `rgba(245,159,10,${0.22 + g * 0.22})`;
    cx.beginPath(); cx.arc(family.x, HUD + family.y - 8, 30, 0, 7); cx.fill();
    chunkyText('HOME!', px(family.x), y - 10 - g * 3, 10, '#d61f7f', 'center', '#fff6e8');
    drawHeart(family.x + 26, HUD + family.y - 26 + Math.sin(stateT * 5) * 3, 5);
  }
}

function drawHeart(x, y, s) {
  cx.fillStyle = '#ff6b81';
  cx.beginPath();
  cx.arc(x - s / 2, y, s / 1.7, 0, 7);
  cx.arc(x + s / 2, y, s / 1.7, 0, 7);
  cx.moveTo(x - s, y + s / 4);
  cx.lineTo(x, y + s * 1.4);
  cx.lineTo(x + s, y + s / 4);
  cx.fill();
}

function drawHUD() {
  cx.fillStyle = '#12082b';
  cx.fillRect(0, 0, W, HUD);
  cx.fillStyle = '#ff4fa3'; cx.fillRect(0, HUD - 3, W, 3);
  chunkyText(`SCORE ${String(score).padStart(6, '0')}`, 8, 16, 13, '#21d3ee', 'left');
  chunkyText(`HI ${String(Math.max(hiscore, score)).padStart(6, '0')}`, 8, 34, 11, '#7e5bef', 'left');
  // lives as hearts
  for (let i = 0; i < lives; i++) drawHeart(190 + i * 20, 16, 6);
  chunkyText('PENNY', 210, 35, 10, '#ffe14d');
  // treats remaining
  const left = treats.filter(t => !t.got).length;
  cx.drawImage(SPR.treat, 300, 8, 20, 14);
  chunkyText(`x ${left}`, 340, 16, 13, '#ffe14d');
  chunkyText(LEVELS[level] ? LEVELS[level].name : '', 330, 35, 9, '#9aa0ab');
  // squirrel-distraction meter
  chunkyText('SQUIRREL METER', 530, 12, 9, '#ff8fb2');
  cx.fillStyle = '#2a1850'; cx.fillRect(460, 20, 140, 12);
  const lvl = penny ? (penny.distractT > 0 ? 1 : penny.distract) : 0;
  cx.fillStyle = lvl > 0.7 ? '#ff4fa3' : '#21d3ee';
  cx.fillRect(462, 22, 136 * Math.min(1, lvl), 8);
  cx.strokeStyle = '#7e5bef'; cx.strokeRect(460.5, 20.5, 140, 12);
  if (penny && penny.focusT > 0 && penny.distractT <= 0)
    chunkyText('FOCUSED!', 530, 41, 9, '#ffe14d');
  if (muted) chunkyText('MUTE', 630, 12, 9, '#9aa0ab');
}

function drawPopups() {
  for (const p of popups) {
    const a = 1 - p.t / 1.2;
    cx.globalAlpha = a;
    chunkyText(p.txt, px(p.x), px(HUD + p.y - p.t * 28), 11, '#d61f7f', 'center', '#fff6e8');
    cx.globalAlpha = 1;
  }
  for (const h of hearts) {
    cx.globalAlpha = Math.max(0, 1 - h.t / h.life);
    drawHeart(h.x, HUD + h.y, 5 + Math.sin(h.t * 8));
    cx.globalAlpha = 1;
  }
  for (const c of confetti) {
    cx.globalAlpha = Math.max(0, 1 - c.t / c.life);
    cx.fillStyle = c.col;
    cx.fillRect(px(c.x), px(HUD + c.y), c.sz, c.sz);
    cx.globalAlpha = 1;
  }
}

function drawScanlines() {
  cx.fillStyle = 'rgba(0,0,0,0.10)';
  for (let y = 0; y < H; y += 3) cx.fillRect(0, y, W, 1);
}

function drawZigzag(y, col) {
  cx.strokeStyle = col; cx.lineWidth = 3;
  cx.beginPath();
  for (let x = 0; x <= W; x += 16) cx.lineTo(x, y + (x / 16 % 2 ? 8 : 0));
  cx.stroke();
}

function drawTitle() {
  const g = cx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2b1158'); g.addColorStop(1, '#0d0626');
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  // memphis party
  for (let i = 0; i < 40; i++) {
    const x = (i * 167) % W, y = (i * 211) % H;
    cx.save(); cx.translate(x, y); cx.rotate(i + stateT * (i % 2 ? .3 : -.3));
    cx.globalAlpha = 0.25;
    cx.fillStyle = ['#ff4fa3', '#21d3ee', '#ffe14d', '#7e5bef'][i % 4];
    if (i % 3 === 0) cx.fillRect(-4, -4, 8, 8);
    else if (i % 3 === 1) { cx.beginPath(); cx.arc(0, 0, 5, 0, 7); cx.fill(); }
    else { cx.beginPath(); cx.moveTo(0, -6); cx.lineTo(6, 5); cx.lineTo(-6, 5); cx.fill(); }
    cx.restore();
  }
  drawZigzag(60, '#21d3ee');
  drawZigzag(H - 64, '#ff4fa3');

  rainbowText('PENNY', W / 2, 120, 64);
  rainbowText('RUNNER', W / 2, 178, 64);
  chunkyText('* A VERY GOOD DOG ADVENTURE *', W / 2, 220, 14, '#21d3ee');

  // warm spotlight so a black dog reads against the dark title backdrop;
  // penny sits centered in the gap between the subtitle and the controls text
  const py = 270;
  const glow = cx.createRadialGradient(W / 2, py, 4, W / 2, py, 42);
  glow.addColorStop(0, 'rgba(255,238,210,0.95)');
  glow.addColorStop(1, 'rgba(255,238,210,0)');
  cx.fillStyle = glow;
  cx.beginPath(); cx.arc(W / 2, py, 42, 0, 7); cx.fill();
  cx.drawImage(SPR.sit, W / 2 - SPR.sit.width / 2, py - SPR.sit.height / 2 + Math.sin(stateT * 3) * 3);
  drawHeart(W / 2 + 30, py - 6 + Math.sin(stateT * 3) * 3, 6);

  chunkyText('ARROWS/WASD: RUN + CLIMB     Z / X: DIG', W / 2, 318, 11, '#fdf6e7');
  chunkyText('COLLECT EVERY TREAT, THEN RUN HOME TO SNUGGLE', W / 2, 338, 11, '#fdf6e7');
  chunkyText('WARNING: SQUIRRELS ARE EXTREMELY DISTRACTING', W / 2, 358, 11, '#ff8fb2');
  if (Math.floor(stateT * 2) % 2 === 0)
    chunkyText('- PRESS ENTER TO PLAY -', W / 2, 392, 16, '#ffe14d');
  chunkyText(`HI SCORE ${String(hiscore).padStart(6, '0')}`, W / 2, 412, 11, '#7e5bef');
  chunkyText('© 1996 GOOD DOG SOFTWARE', W / 2, H - 6, 9, '#5a5470');
}

function drawWorld() {
  drawBG();
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawTile(c, r);
  drawFamily();
  drawTreats();
  for (const s of squirrels) drawSquirrel(s);
  drawPenny();
  drawPopups();
}

function draw() {
  cx.clearRect(0, 0, W, H);
  if (state === 'title') {
    drawTitle();
  } else if (state === 'gameover') {
    drawWorld(); drawHUD();
    cx.fillStyle = 'rgba(13,6,38,0.85)'; cx.fillRect(0, 0, W, H);
    rainbowText('GAME OVER', W / 2, H / 2 - 40, 48);
    chunkyText('PENNY NEEDS A NAP... SHE IS STILL A VERY GOOD DOG', W / 2, H / 2 + 8, 12, '#fdf6e7');
    chunkyText(`FINAL SCORE ${score}`, W / 2, H / 2 + 34, 14, '#ffe14d');
    if (Math.floor(stateT * 2) % 2 === 0)
      chunkyText('- PRESS ENTER -', W / 2, H / 2 + 70, 14, '#21d3ee');
  } else if (state === 'win') {
    drawTitle();
    cx.fillStyle = 'rgba(13,6,38,0.75)'; cx.fillRect(0, 80, W, 260);
    rainbowText('YOU DID IT!', W / 2, 130, 44);
    chunkyText('EVERY TREAT FOUND. EVERY SQUIRREL BOOPED.', W / 2, 176, 12, '#fdf6e7');
    chunkyText('MAXIMUM SNUGGLES ACHIEVED.', W / 2, 196, 12, '#fdf6e7');
    rainbowText('PENNY IS A VERY GOOD DOG', W / 2, 240, 26);
    chunkyText(`FINAL SCORE ${score}`, W / 2, 280, 14, '#ffe14d');
    if (Math.floor(stateT * 2) % 2 === 0)
      chunkyText('- PRESS ENTER TO PLAY AGAIN -', W / 2, 312, 13, '#21d3ee');
    if (Math.random() < 0.2) heartBurst(Math.random() * W, Math.random() * 200 + 100, 1);
    drawPopups();
  } else {
    drawWorld();
    drawHUD();
    if (state === 'intro') {
      cx.fillStyle = 'rgba(13,6,38,0.7)'; cx.fillRect(0, H / 2 - 56, W, 112);
      rainbowText(LEVELS[level].name, W / 2, H / 2 - 16, 26);
      chunkyText(LEVELS[level].tip, W / 2, H / 2 + 20, 12, '#fdf6e7');
    }
    if (state === 'snuggle') {
      const a = Math.min(0.5, stateT * 0.5);
      cx.fillStyle = `rgba(255,79,163,${a * 0.25})`; cx.fillRect(0, 0, W, H);
      rainbowText('SNUGGLE TIME!', W / 2, H / 2 - 60, 36);
    }
    if (state === 'dead') {
      cx.fillStyle = 'rgba(13,6,38,0.55)'; cx.fillRect(0, 0, W, H);
      chunkyText('RUFF... TRY AGAIN, PENNY!', W / 2, H / 2, 20, '#ff8fb2');
    }
  }
  drawScanlines();
}

/* ------------------------------ main loop ------------------------------ */
let last = 0;
function loop(ts) {
  const dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

buildSprites();
loadLevel(0); // so title backdrop has something if needed
setState('title');
requestAnimationFrame(loop);
