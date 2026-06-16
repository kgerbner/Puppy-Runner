/* ==========================================================================
   PENNY RUNNER — A Very Good Dog Adventure
   A Lode Runner inspired game starring Penny the Cavalier King Charles
   Spaniel. Collect every treat, dodge (or boop) the squirrels, and get
   home for snuggle time. © 1996 GOOD DOG SOFTWARE (in spirit).
   ========================================================================== */
'use strict';

/* ----------------------------- constants ------------------------------ */
const VERSION = 'v2.6';                      // shown on title + HUD; bump on balance changes
const COLS = 28, ROWS = 16, T = 24;          // grid + tile size (px)
const HUD = 48;                              // hud bar height (px)
const W = COLS * T, H = ROWS * T + HUD;      // canvas size

const PENNY_SPEED  = 92;     // px/s walking
const CLIMB_SPEED  = 78;
const FALL_SPEED   = 168;
const SQRL_SPEED   = 54;     // squirrels are clearly slower than Penny (92) so she can outrun them
const BEAR_SPEED   = 30;     // the bear lumbers - lethal, climbs slowly, but easy to outrun
const LIVES_START  = 5;
const DIG_TIME     = 0.34;   // s, penny locked while digging
const HOLE_LIFE    = 5.2;    // s before a hole refills
const HOLE_WARN    = 4.0;    // s, when refill flicker starts
const TRAP_TIME    = 2.9;    // s a squirrel stays trapped
const SPAWN_INVULN = 1.6;    // s of immunity after (re)spawning
const SQRL_WARN    = 3.6 * T; // distance at which the HUD warns of a squirrel
const NUT_RANGE    = 4.5 * T; // how close a squirrel must be to receive a nut
const NUT_FLEE     = 0.9;    // s the squirrel sprints away with its prize
const NUT_EAT      = 6.0;    // s the squirrel sits and munches (harmless)
const NUT_MAX      = 3;      // most nuts Penny can carry

const YELLS = ['RADICAL!', 'TUBULAR!', 'PAW-SOME!', 'TOTALLY!', 'WOOF!',
               'BODACIOUS!', 'AS IF!', 'COWABUNGA!', 'YUM!'];

/* ------------------------------- levels --------------------------------
   legend:  # brick (diggable)   = bedrock (solid)   H ladder   - bar
            t treat   n nut   s squirrel   P penny start   F family couch
            . empty
   Each map is 16 rows of 28 chars (validated by tools/validate-levels.mjs)
------------------------------------------------------------------------- */
const LEVELS = [
  {
    name: 'LEVEL 1: BACKYARD BASICS',
    tip: 'Grab every treat, then head home to the family!',
    sqSpeed: 0.55,   // squirrel speed multiplier (Penny is much faster)
    map: [
      '............................',
      '............................',
      '....t................t......',
      '...####H...........H####....',
      '.......H...........H........',
      '.......H-----------H........',
      '.t...n.H...........H..s..t..',
      '####H#####.......#########H#',
      '....H.....................H.',
      '....H........t............H.',
      '....H.....H#####H.........H.',
      '....H.....H.....H.........H.',
      '..t.H.....H..t..H.........H.',
      '#######H##########H#########',
      '.P.....H....n.....H....t..F.',
      '============================',
    ],
  },
  {
    name: 'LEVEL 2: SQUIRREL PARK',
    tip: 'Squirrel trouble? Grab a nut and press SPACE to bribe it!',
    sqSpeed: 0.62,
    map: [
      '............................',
      '..t.....................t...',
      '.####H..............H####...',
      '.....H-------------H........',
      '.....H..............H.......',
      '..s..H.n..t....t....H..s....',
      '###H#####H######H#####H#####',
      '...H.....H......H.....H.....',
      '...H..t..H......H..t..H.....',
      '...####H##..tt.H##H####.....',
      '.......H..#####H..H.........',
      '.......H.......H..H.........',
      '..t....H.......H..H....t....',
      '####H#####################H#',
      '.P..H...t...n.......t..F..H.',
      '============================',
    ],
  },
  {
    name: 'LEVEL 3: THE BIG DIG',
    tip: 'Press Z / X to dig! Trap squirrels, tunnel to treats.',
    sqSpeed: 0.68,
    map: [
      '............................',
      '.....t...............t......',
      '..H#####----------#####H....',
      '..H....................H...H',
      '..H...t....s........t..H...H',
      '..H#####H##########H###H#..H',
      '........H..t....t..H.......H',
      '........H#########.H.......H',
      '.t...n..H..........H......t.',
      '###H#######......##H###H####',
      '...H...............H........',
      '...H...####H######.H........',
      '...H...#...H.....#.H..s.....',
      '...H...#.t.H..t..#.H#####H..',
      '.P.H...###########nHF....H..',
      '============================',
    ],
  },
  {
    name: 'LEVEL 4: POCONOS LAKE',
    tip: 'A BEAR! It is slow but deadly - nuts will not work. Dodge it or dig a hole!',
    sqSpeed: 0.66,
    theme: 'lake',
    map: [
      '............................',
      '............................',
      '............................',
      '......H...t....n.....H......',
      '######H##############H######',
      '......H..............H......',
      '......H--------------H......',
      '......H.....t........H......',
      '######H##############H######',
      '......H..............H......',
      '......H..t.......t...H......',
      '######H##############H######',
      '......H..............H......',
      '......H..............H......',
      '.P.n..H..s...b.t..s..H....F.',
      '============================',
    ],
  },
  {
    name: "LEVEL 5: GIGI & BABU'S HOUSE",
    tip: 'Run home to Gigi, Babu and the whole family! Mind the bear and 3 squirrels.',
    sqSpeed: 0.66,
    theme: 'home',
    map: [
      '............................',
      '............................',
      '............................',
      '....H....t...H....n....H....',
      '####H########H#########H####',
      '....H........H.........H....',
      '....H--------H---------H....',
      '....H...t....H....t....H....',
      '####H########H#########H####',
      '....H........H.........H....',
      '....H...n....H..s.t....H....',
      '####H########H#########H####',
      '....H........H.........H....',
      '....H........H.........H....',
      '.Pn.H...s...bH....s.t..HF...',
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
  L: '#946330', D: '#43291a', // kids' hair: (darker) light brown / dark brown
  f: '#c98a52', // freckles
  B: '#8a5a32', U: '#5e3c20', // bear: brown / dark brown shading
  C: '#5c4326', S: '#cdd3dc', // Babu's brown hair / Gigi's silver stripe
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

// Poconos black bear, STANDING upright, facing left. 12 x 16. Big and slow.
const BEAR = [[
  '.UU.....UU..',
  '.UBU...UBU..',
  '.UBBUUUBBBU.',
  'UBBBBBBBBBU.',
  'UkwBBBBkwBU.',
  'UBBBBBBBBBU.',
  'sskBBBBBBBU.',
  'sssBBBBBBBU.',
  '.UBBBBBBBU..',
  'UBBBBBBBBBBU',
  'UBBBBBBBBBBU',
  '.UBBBBBBBU..',
  '.UBBBBBBBU..',
  '.UBBUUBBBU..',
  '.UBU..UBU...',
  '.UU....UU...',
], [
  '.UU.....UU..',
  '.UBU...UBU..',
  '.UBBUUUBBBU.',
  'UBBBBBBBBBU.',
  'UkwBBBBkwBU.',
  'UBBBBBBBBBU.',
  'sskBBBBBBBU.',
  'sssBBBBBBBU.',
  '.UBBBBBBBU..',
  'UBBBBBBBBBBU',
  'UBBBBBBBBBBU',
  '.UBBBBBBBU..',
  '.UBBBBBBBU..',
  '.UBBUUBBBU..',
  '..UBU.UBU...',
  '..UU..UU....',
]];

// Acorn nut pickup. 8 x 8.
const NUT = [[
  '...DD...',
  '.DDDDDD.',
  'DDDDDDDD',
  '.LLLLLL.',
  '.LwLLLL.',
  '.LLLLLL.',
  '..LLLL..',
  '...LL...',
]];

// Babu: grandpa, short curly brown hair (C), blue t-shirt (b). 12 x 15.
const BABU = [[
  '..C.CC.C....',
  '.CCCCCCCC...',
  '.CCCCCCCCC..',
  '.CsssssssC..',
  '..ssssssss..',
  '..skssskss..',
  '..ssssssss..',
  '..ssshhsss..',
  '...ssssss...',
  '..bbbbbbbb..',
  '.bbbbbbbbbb.',
  '.bbbbbbbbbb.',
  '.bsbbbbbbsb.',
  '.bbbbbbbbbb.',
  '.bb......bb.',
]];

// Gigi: grandma, chin-length black hair (k) with a silver stripe (S),
// coral cardigan (h). 12 x 15.
const GIGI = [[
  '..kSkkkkk...',
  '..kSkkkkkk..',
  '..kSkkkkkk..',
  '..kssssssk..',
  '..kssssssk..',
  '..kGkGGkGk..',
  '..ksGssGsk..',
  '..ksshhssk..',
  '..kssssssk..',
  '...hhhhhh...',
  '..hhhhhhhh..',
  '.hhhhhhhhhh.',
  '.hshhhhhhsh.',
  '.hhhhhhhhhh.',
  '.hh......hh.',
]];

// The family: three kids on the couch.
//   left  = oldest (12), girl, light brown hair (L), shoulder length
//   middle= 9-year-old, girl, dark brown hair (D), below the shoulders
//   right = boy (6), dark brown hair (D), short  -  smallest, sits lowest
// 28 x 16.
const FAMILY = [[
  '............................',
  '...LLLLL....................',
  '..LLLLLLL..DDDDDD...........',
  '..LsssssL.DDDDDDDD..........',
  '..LkssksL.DssssssD..DDDDDD..',
  '..LsshssL.DskfkssD..DssssD..',
  '..LsssssL.DfshhsfD..skssks..',
  '..LsssssL.DDssssDD..sshhss..',
  '..mmmmmmm.DyyyyyyD..bbbbbb..',
  '..mmmmmmm.DyyyyyyD..bbbbbb..',
  'vvvvvvvvvvvvvvvvvvvvvvvvvvvv',
  'vvvvvvvvvnvvvvvvvvnvvvvvvvvv',
  'vvvvvvvvvnvvvvvvvvnvvvvvvvvv',
  'nnnnnnnnnnnnnnnnnnnnnnnnnnnn',
  '.vv......................vv.',
  '............................',
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
  SPR.bearL  = BEAR.map(f => buildSprite(f, 1.7));
  SPR.bearR  = SPR.bearL.map(flipSprite);
  SPR.treat  = buildSprite(TREAT[0], 1.6);
  SPR.nut    = buildSprite(NUT[0], 1.7);
  SPR.family = buildSprite(FAMILY[0], 2.0);
  SPR.babu   = buildSprite(BABU[0], 2.1);
  SPR.gigi   = buildSprite(GIGI[0], 2.1);
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
  nut:     () => { tone(740, .07, 'triangle', .14); tone(988, .1, 'triangle', .14, .07); },
  give:    () => { tone(880, .08, 'triangle', .13); tone(660, .08, 'triangle', .13, .08); tone(990, .14, 'triangle', .13, .16); },
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
let level = 0, score = 0, lives = LIVES_START, hiscore = 0;
let grid = [], holes = new Map(), treats = [], nuts = [], squirrels = [], bears = [];
let penny = null, family = { x: 0, y: 0 };
let exitOpen = false, popups = [], hearts = [], confetti = [];
let nutHintShown = false;   // teach SPACE the first time Penny pockets a nut
let levelTime = 0, frame = 0;
try { hiscore = +localStorage.getItem('pennyHi') || 0; } catch (e) {}

const keys = {};
addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  audio();
  if (e.key.toLowerCase() === 'm') muted = !muted;
  if (e.key === 'Enter') {
    if (state === 'gameover') retryLevel();           // kids: retry the SAME level, fresh lives
    else if (state === 'title' || state === 'win') startGame();
  }
  // title-screen level select: press 1-4 to jump straight to a level
  if ((state === 'title' || state === 'win') && e.key >= '1' && e.key <= String(LEVELS.length)) {
    startGame(); level = +e.key - 1; lives = LIVES_START; score = 0; loadLevel(level); setState('intro');
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
  grid = []; holes.clear(); treats = []; nuts = []; squirrels = []; bears = [];
  exitOpen = false; popups = []; hearts = []; levelTime = 0;
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      let ch = L.map[r][c];
      if (ch === 't') { treats.push({ c, r, got: false }); ch = '.'; }
      else if (ch === 'n') { nuts.push({ c, r, got: false }); ch = '.'; }
      else if (ch === 'P') { penny = makePenny(c, r); ch = '.'; }
      else if (ch === 's') { squirrels.push(makeSquirrel(c, r, L.sqSpeed ?? 1)); ch = '.'; } // per-level squirrel speed
      else if (ch === 'b') { bears.push(makeBear(c, r)); ch = '.'; }
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
    digT: 0, digDir: 0, invuln: SPAWN_INVULN, tailWag: 0, nuts: 0,
  };
}
function makeSquirrel(c, r, factor) {
  return {
    x: c * T + T / 2, y: r * T + T / 2, spawnC: c, spawnR: r,
    face: -1, anim: Math.random() * 9, falling: false, climbing: false,
    trapped: 0, scamperT: 0, thinkT: Math.random() * .2, lr: 0, ud: 0,
    spd: SQRL_SPEED * factor, fleeT: 0, eatT: 0,
  };
}
function makeBear(c, r) {
  return {
    x: c * T + T / 2, y: r * T + T / 2, spawnC: c, spawnR: r,
    face: -1, anim: Math.random() * 9, falling: false, climbing: false,
    trapped: 0, scamperT: 0, thinkT: Math.random() * .2, lr: 0, ud: 0,
    spd: BEAR_SPEED, climbSpd: BEAR_SPEED * 1.5, fleeT: 0, eatT: 0, isBear: true,
  };
}

function startGame() {
  level = 0; score = 0; lives = LIVES_START;
  loadLevel(level);
  setState('intro');
  SFX.start();
}
// On game over, kids retry the SAME level with fresh lives (keeping their score)
// instead of being thrown all the way back to Level 1.
function retryLevel() {
  lives = LIVES_START;
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
    const ny = a.y + ud * (a.climbSpd || CLIMB_SPEED) * dt;
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
  if (a.onBar && ud > 0) {
    a.onBar = false;
    if (!solid(c, r + 1)) {            // clear the bar's re-catch zone so she actually falls through
      a.falling = true;
      a.y = center(r) + T * 0.55;
    }
    return;
  }

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

// Give a nut to the nearest squirrel: it sprints off and munches, harmless.
function giveNut() {
  if (penny.nuts <= 0) {
    award(0, penny.x, penny.y - 18, 'NO NUTS!');
    return;
  }
  let best = null, bd = NUT_RANGE;
  for (const s of squirrels) {
    if (s.trapped > 0 || s.fleeT > 0 || s.eatT > 0) continue;
    const d = Math.hypot(s.x - penny.x, s.y - penny.y);
    if (d < bd) { bd = d; best = s; }
  }
  if (!best) {                       // no squirrel close enough: keep the nut
    let bearNear = false;
    for (const bb of bears) if (bb.trapped <= 0 && Math.hypot(bb.x - penny.x, bb.y - penny.y) < NUT_RANGE) bearNear = true;
    award(0, penny.x, penny.y - 18, bearNear ? "BEARS DON'T WANT NUTS!" : 'NO SQUIRREL NEAR!');
    return;
  }
  penny.nuts--;
  best.fleeT = NUT_FLEE;
  best.face = Math.sign(best.x - penny.x) || penny.face; // run AWAY from penny
  score += 50;
  award(0, best.x, best.y - 16, 'NUTS! +50');
  SFX.give();
  heartBurst(best.x, best.y - 8, 2);
}

function updateHoles(dt) {
  for (const [k, h] of [...holes]) {
    h.t += dt;
    if (h.t >= HOLE_LIFE) {
      holes.delete(k);
      SFX.fill();
      // anyone inside?
      if (colOf(penny) === h.c && rowOf(penny) === h.r && state === 'play') loseLife(false);
      for (const s of [...squirrels, ...bears]) {
        if (colOf(s) === h.c && rowOf(s) === h.r) respawnSquirrel(s);
      }
    }
  }
}

/* ------------------------------ squirrels ------------------------------ */
function respawnSquirrel(s) {
  s.x = center(s.spawnC); s.y = center(s.spawnR);
  s.trapped = 0; s.falling = false; s.climbing = false; s.onBar = false; s.scamperT = 0;
  s.fleeT = 0; s.eatT = 0;
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
    s.fleeT = 0; s.eatT = 0;
    award(s.isBear ? 200 : 75, s.x, s.y - 14, s.isBear ? 'BEAR TRAPPED!' : 'GOTCHA!');
    SFX.trap();
    return;
  }

  // bribed with a nut: sprint away with the prize, then sit and munch
  if (s.fleeT > 0) {
    s.fleeT -= dt;
    moveActor(s, s.face, 0, s.spd * 1.8, dt);
    if (s.fleeT <= 0 && !s.falling) s.eatT = NUT_EAT;
    if (s.fleeT <= 0 && s.falling) s.fleeT = 0.05; // keep going until she lands
    return;
  }
  if (s.eatT > 0) {
    if (s.falling) { moveActor(s, 0, 0, s.spd, dt); return; } // gravity still applies
    s.eatT -= dt;
    s.anim += dt * 6; // happy munching wiggle
    return;
  }

  s.thinkT -= dt;
  if (s.thinkT <= 0) {
    s.thinkT = 0.18 + Math.random() * 0.1;
    const pc = colOf(penny), pr = rowOf(penny);
    s.lr = 0; s.ud = 0;
    if (s.scamperT > 0) { s.lr = s.face; }
    else if (!s.isBear && Math.random() < 0.06) { s.lr = Math.random() < 0.5 ? -1 : 1; } // squirrel brain
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

  const speed = s.scamperT > 0 ? s.spd * 1.7 : s.spd;
  const ox = s.x;
  moveActor(s, s.lr, s.ud, speed, dt);
  if (s.lr !== 0 && Math.abs(s.x - ox) < 0.01 && !s.falling) s.face *= -1; // bonked a wall
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
  penny.invuln = SPAWN_INVULN;
  for (const s of [...squirrels, ...bears]) respawnSquirrel(s);
}

/* -------------------------------- update ------------------------------- */
function updatePlay(dt) {
  levelTime += dt;
  updateHoles(dt);
  if (penny.invuln > 0) penny.invuln -= dt;

  // --- penny input / movement ---
  let lr = 0, ud = 0;
  if (penny.digT <= 0) {
    if (keys['arrowleft'] || keys['a']) lr = -1;
    if (keys['arrowright'] || keys['d']) lr = 1;
    if (keys['arrowup'] || keys['w']) ud = -1;
    if (keys['arrowdown'] || keys['s']) ud = 1;
    if ((keys['z'] || keys['q']) && !penny.falling && !penny.onBar) { keys['z'] = keys['q'] = false; tryDig(-1); }
    if ((keys['x'] || keys['e']) && !penny.falling && !penny.onBar) { keys['x'] = keys['e'] = false; tryDig(1); }
    if (keys[' '] || keys['c']) { keys[' '] = keys['c'] = false; giveNut(); }
  }
  if (penny.digT > 0) penny.digT -= dt;
  else moveActor(penny, lr, ud, PENNY_SPEED, dt);
  penny.tailWag += dt * (lr !== 0 ? 14 : 6);

  // --- squirrels and the bear ---
  for (const s of squirrels) updateSquirrel(s, dt);
  for (const b of bears) updateSquirrel(b, dt);

  // --- a squirrel or bear catches Penny: lose a life (Lode Runner style) ---
  if (penny.invuln <= 0) {
    for (const s of [...squirrels, ...bears]) {
      if (s.trapped > 0 || s.fleeT > 0 || s.eatT > 0) continue; // trapped or bribed = harmless
      const reach = s.isBear ? 17 : 14; // the bear's hug has a wider reach
      if (Math.abs(s.x - penny.x) < reach && Math.abs(s.y - penny.y) < reach) {
        loseLife(false);
        return; // state changed to dead/gameover
      }
    }
  }

  // --- nuts ---
  for (const nt of nuts) {
    if (nt.got || penny.nuts >= NUT_MAX) continue;
    if (colOf(penny) === nt.c && rowOf(penny) === nt.r) {
      nt.got = true; penny.nuts++;
      award(0, penny.x, penny.y - 18, '+1 NUT!');
      SFX.nut();
      if (!nutHintShown) {
        nutHintShown = true;
        popups.push({ x: penny.x, y: penny.y - 34, t: -1.4, txt: 'PRESS SPACE BY A SQUIRREL!' });
      }
    }
  }

  // --- treats ---
  let left = 0;
  for (const t of treats) {
    if (t.got) continue;
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
  if (LEVELS[level] && LEVELS[level].theme === 'lake') { drawLakeBG(); return; }
  if (LEVELS[level] && LEVELS[level].theme === 'home') { drawHomeBG(); return; }
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

// Poconos lakeside backdrop: pale sky, pine-covered ridges, a glittering lake.
// Kept light so a black-and-tan dog still pops.
function drawLakeBG() {
  const g = cx.createLinearGradient(0, HUD, 0, H);
  g.addColorStop(0, '#dff1fb'); g.addColorStop(0.5, '#cfeaf6'); g.addColorStop(0.62, '#bfe6f2'); g.addColorStop(1, '#8fd3e6');
  cx.fillStyle = g; cx.fillRect(0, HUD, W, H - HUD);
  // sun
  cx.fillStyle = 'rgba(255,239,170,0.8)';
  cx.beginPath(); cx.arc(W - 70, HUD + 46, 22, 0, 7); cx.fill();
  // distant blue mountain ridge
  cx.fillStyle = '#a9c4d6';
  cx.beginPath(); cx.moveTo(0, HUD + 120);
  for (let x = 0; x <= W; x += 48) cx.lineTo(x, HUD + 92 + ((x / 48) % 2 ? 22 : 0));
  cx.lineTo(W, HUD + 160); cx.lineTo(0, HUD + 160); cx.fill();
  // pine tree line (deterministic)
  for (let i = 0; i < 30; i++) {
    const tx = (i * 113) % W, base = HUD + 150 + ((i * 37) % 18);
    const h = 26 + ((i * 53) % 16), w = 9 + ((i * 29) % 5);
    cx.fillStyle = i % 2 ? '#2f7a4f' : '#256b45';
    cx.beginPath();
    cx.moveTo(tx, base - h); cx.lineTo(tx - w, base); cx.lineTo(tx + w, base); cx.fill();
    cx.beginPath();
    cx.moveTo(tx, base - h - 8); cx.lineTo(tx - w * 0.7, base - h * 0.4); cx.lineTo(tx + w * 0.7, base - h * 0.4); cx.fill();
  }
  // lake band with sparkles near the bottom
  cx.fillStyle = 'rgba(110,200,230,0.35)';
  cx.fillRect(0, H - 90, W, 90);
  for (let i = 0; i < 22; i++) {
    const sx = (i * 89) % W, sy = H - 78 + ((i * 41) % 60);
    cx.fillStyle = 'rgba(255,255,255,0.5)';
    cx.fillRect(sx, sy, 6, 1);
  }
}

// Cozy indoor room at Gigi & Babu's: warm wallpaper, framed pictures, a lamp,
// a rug. Kept light so a black-and-tan dog still pops.
function drawHomeBG() {
  const g = cx.createLinearGradient(0, HUD, 0, H);
  g.addColorStop(0, '#fcecd0'); g.addColorStop(1, '#f3dab4');
  cx.fillStyle = g; cx.fillRect(0, HUD, W, H - HUD);
  // wallpaper: soft vertical stripes
  cx.fillStyle = 'rgba(208,158,108,0.10)';
  for (let x = 0; x < W; x += 28) cx.fillRect(x, HUD, 14, H - HUD);
  // a row of little diamonds high on the wall
  cx.fillStyle = 'rgba(196,118,88,0.16)';
  for (let x = 14; x < W; x += 56) { cx.save(); cx.translate(x, HUD + 22); cx.rotate(Math.PI / 4); cx.fillRect(-3, -3, 6, 6); cx.restore(); }
  // framed pictures on the wall
  const frame = (fx, fy, fw, fh) => {
    cx.fillStyle = '#7a5230'; cx.fillRect(fx, fy, fw, fh);
    cx.fillStyle = '#fff6e6'; cx.fillRect(fx + 3, fy + 3, fw - 6, fh - 6);
  };
  frame(74, HUD + 36, 48, 38); drawHeart(98, HUD + 57, 5);
  frame(150, HUD + 44, 34, 30);
  frame(W - 170, HUD + 34, 40, 50);
  // a floor lamp in the right corner with a warm glow
  cx.fillStyle = '#caa15a'; cx.fillRect(W - 46, HUD + 44, 6, 150);
  cx.fillStyle = '#f2c879';
  cx.beginPath(); cx.moveTo(W - 60, HUD + 46); cx.lineTo(W - 26, HUD + 46); cx.lineTo(W - 32, HUD + 22); cx.lineTo(W - 54, HUD + 22); cx.fill();
  const glow = cx.createRadialGradient(W - 43, HUD + 40, 4, W - 43, HUD + 40, 54);
  glow.addColorStop(0, 'rgba(255,240,200,0.55)'); glow.addColorStop(1, 'rgba(255,240,200,0)');
  cx.fillStyle = glow; cx.beginPath(); cx.arc(W - 43, HUD + 40, 54, 0, 7); cx.fill();
  // a patterned rug along the floor
  cx.fillStyle = 'rgba(180,90,70,0.16)'; cx.fillRect(0, H - 64, W, 64);
  cx.strokeStyle = 'rgba(120,60,45,0.22)'; cx.lineWidth = 2;
  cx.strokeRect(40, H - 56, W - 80, 48);
  for (let x = 56; x < W - 40; x += 24) { cx.beginPath(); cx.moveTo(x, H - 52); cx.lineTo(x + 10, H - 12); cx.stroke(); }
}

// A wooden dock jutting out over the lake on the right, where the family waits.
function drawDock() {
  const deckTop = H - 26, x0 = Math.round(W * 0.54), x1 = W;
  // support posts down into the water
  cx.fillStyle = '#5e3c20';
  for (let xp = x0 + 14; xp < x1 - 6; xp += 38) cx.fillRect(xp, deckTop, 7, 26);
  // deck planks
  cx.fillStyle = '#9a7a50'; cx.fillRect(x0, deckTop - 9, x1 - x0, 12);
  cx.fillStyle = '#b08f60'; cx.fillRect(x0, deckTop - 9, x1 - x0, 3);
  cx.fillStyle = '#6b4a2f';
  for (let xs = x0; xs < x1; xs += 18) cx.fillRect(xs, deckTop - 9, 1, 12); // plank seams
  // two pilings poking up at the lake end
  cx.fillStyle = '#6b4a2f';
  cx.fillRect(x0 + 2, deckTop - 22, 7, 15);
  cx.fillRect(x0 + 1, deckTop - 25, 9, 4);
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
  if (a.invuln > 0 && Math.floor(frame / 4) % 2) return; // blink while invulnerable
  cx.drawImage(img, dx, dy);

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
  if (s.eatT > 0 || s.fleeT > 0) {
    const munch = s.eatT > 0 ? Math.sin(s.anim * 4) * 1.5 : 0;
    cx.drawImage(SPR.nut, px(s.x - s.face * 10 - SPR.nut.width / 2), px(dy + 6 + munch));
    if (s.eatT > 0) chunkyText('NOM', px(s.x), px(dy - 8), 9, '#d59247', 'center', '#fff6e8');
  }
}

function drawBear(b) {
  const img = (b.face < 0 ? SPR.bearL : SPR.bearR)[Math.floor(b.anim) % 2];
  let dy = HUD + b.y - img.height + T / 2;
  if (b.trapped > 0) dy += 8; // sunk in the hole
  cx.drawImage(img, px(b.x - img.width / 2), px(dy));
  if (b.trapped > 0) chunkyText('!', px(b.x), px(dy - 8), 12, '#ffe14d');
}

function drawTreats() {
  for (const t of treats) {
    if (t.got) continue;
    const bob = Math.sin(stateT * 4 + t.c) * 1.5;
    cx.drawImage(SPR.treat, px(t.c * T + T / 2 - SPR.treat.width / 2),
                 px(HUD + t.r * T + T - SPR.treat.height - 2 + bob));
  }
  for (const nt of nuts) {
    if (nt.got) continue;
    const bob = Math.sin(stateT * 4 + nt.c * 2) * 1.5;
    cx.drawImage(SPR.nut, px(nt.c * T + T / 2 - SPR.nut.width / 2),
                 px(HUD + nt.r * T + T - SPR.nut.height - 2 + bob));
  }
}

function drawFamily() {
  const img = SPR.family;
  const baseY = HUD + family.y + T / 2;        // everyone's feet line
  const x = px(family.x - img.width / 2);
  const y = px(baseY - img.height);
  // Gigi & Babu's house: grandparents flank the three grandkids
  if (LEVELS[level] && LEVELS[level].theme === 'home') {
    cx.drawImage(SPR.babu, px(x - SPR.babu.width + 4), px(baseY - SPR.babu.height));
    cx.drawImage(SPR.gigi, px(x + img.width - 4), px(baseY - SPR.gigi.height));
  }
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
  // nut pouch + what the spacebar is for (always visible)
  cx.drawImage(SPR.nut, 386, 6, 15, 15);
  chunkyText(`x ${penny ? penny.nuts : 0}`, 424, 16, 13, '#d59247');
  chunkyText('SPACE = GIVE NUT', 300, 35, 9, '#d59247', 'left');
  // danger warning: nearest active squirrel / bear
  let near = 1e9, bearNear = false;
  for (const s of squirrels) {
    if (s.trapped > 0 || s.fleeT > 0 || s.eatT > 0) continue;
    near = Math.min(near, Math.hypot(s.x - penny.x, s.y - penny.y));
  }
  for (const b of bears) {
    if (b.trapped > 0) continue;
    const d = Math.hypot(b.x - penny.x, b.y - penny.y);
    if (d < near) { near = d; if (d < SQRL_WARN) bearNear = true; }
  }
  const haveNuts = penny && penny.nuts > 0;
  cx.drawImage(bearNear ? SPR.bearL[0] : SPR.sqrlL[0], 470, bearNear ? 18 : 14, bearNear ? 28 : 24, bearNear ? 22 : 19);
  if (near < SQRL_WARN) {
    // steady text, gentle 1s colour pulse — urgent but not strobing
    const hot = Math.floor(frame / 30) % 2;
    chunkyText(bearNear ? '!! BEAR !!' : '!! SQUIRREL !!', 588, 16, 11, hot ? '#ff4fa3' : '#ff8fb2');
    chunkyText(bearNear ? 'RUN! BEARS LOVE HOLES' : (haveNuts ? 'SPACE: GIVE A NUT!' : 'RUN, OR TRAP IT!'), 588, 35, 9, '#ffe14d');
  } else {
    chunkyText(bears.length ? 'WATCH FOR THE BEAR' : 'AVOID SQUIRRELS', 588, 16, 10, '#ff8fb2');
    chunkyText(bears.length ? 'DODGE IT OR TRAP IT' : 'OR BRIBE WITH A NUT', 588, 35, 9, '#9aa0ab');
  }
  if (muted) chunkyText('MUTE', 760, 16, 9, '#9aa0ab');
  chunkyText(VERSION, W - 4, 40, 8, '#5a5470', 'right');
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

  chunkyText('ARROWS/WASD: RUN + CLIMB   Z/X: DIG   SPACE: GIVE NUT', W / 2, 318, 11, '#fdf6e7');
  chunkyText('COLLECT EVERY TREAT, THEN RUN HOME TO SNUGGLE', W / 2, 338, 11, '#fdf6e7');
  chunkyText('DODGE SQUIRRELS! TRAP THEM IN HOLES, OR BRIBE THEM WITH NUTS', W / 2, 358, 11, '#ff8fb2');
  if (Math.floor(stateT * 2) % 2 === 0)
    chunkyText('- PRESS ENTER TO PLAY -', W / 2, 390, 16, '#ffe14d');
  chunkyText(`PRESS 1-${LEVELS.length} TO PICK A LEVEL`, W / 2, 410, 9, '#7e5bef');
  chunkyText(`HI SCORE ${String(hiscore).padStart(6, '0')}`, W / 2, 426, 11, '#7e5bef');
  chunkyText('© 1996 GOOD DOG SOFTWARE', W / 2, H - 6, 9, '#5a5470');
  chunkyText(VERSION, W - 8, H - 6, 9, '#5a5470', 'right');
}

function drawWorld() {
  drawBG();
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawTile(c, r);
  if (LEVELS[level] && LEVELS[level].theme === 'lake') drawDock();
  drawFamily();
  drawTreats();
  for (const s of squirrels) drawSquirrel(s);
  for (const b of bears) drawBear(b);
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
    rainbowText('OUT OF LIVES!', W / 2, H / 2 - 40, 44);
    chunkyText('PENNY NEEDS A QUICK NAP... SHE IS STILL A VERY GOOD DOG', W / 2, H / 2 + 8, 12, '#fdf6e7');
    chunkyText(`SCORE ${score}`, W / 2, H / 2 + 34, 14, '#ffe14d');
    if (Math.floor(stateT * 2) % 2 === 0)
      chunkyText(`- PRESS ENTER TO TRY ${LEVELS[level].name.split(':')[0]} AGAIN -`, W / 2, H / 2 + 70, 13, '#21d3ee');
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
