#!/usr/bin/env node
/* Validates the LEVELS maps in game.js:
   - 16 rows x 28 cols, legal chars, exactly one P and one F
   - every treat and the family couch reachable from Penny's spawn
     using walk / fall / climb / bar moves only (digging not required) */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'game.js'), 'utf8');
const m = src.match(/const LEVELS = \[[\s\S]*?\n\];/);
if (!m) { console.error('could not find LEVELS in game.js'); process.exit(1); }
const LEVELS = new Function(`${m[0].replace('const LEVELS =', 'return')}`)();

const ROWS = 16, COLS = 28, LEGAL = new Set('#=H-tnsPF.'.split(''));
let anyFailed = false;

for (const L of LEVELS) {
  console.log(L.name);
  let failed = false;
  const fail = (msg) => { failed = true; anyFailed = true; console.error('  FAIL ' + msg); };
  const map = L.map;
  if (map.length !== ROWS) fail(`has ${map.length} rows, expected ${ROWS}`);
  map.forEach((row, r) => {
    if (row.length !== COLS) fail(`row ${r} has ${row.length} cols, expected ${COLS}`);
    for (const ch of row) if (!LEGAL.has(ch)) fail(`row ${r} has illegal char '${ch}'`);
  });
  if (failed) continue;

  const at = (c, r) => (r < 0 || r >= ROWS || c < 0 || c >= COLS) ? '=' : map[r][c];
  // entities stand on '.'-like tiles; t/s/P/F behave as empty space
  const space = (ch) => !'#='.includes(ch);
  const solid = (c, r) => !space(at(c, r));

  let start = null, fam = null;
  const treats = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const ch = at(c, r);
      if (ch === 'P') { if (start) fail('multiple P'); start = [c, r]; }
      if (ch === 'F') { if (fam) fail('multiple F'); fam = [c, r]; }
      if (ch === 't') treats.push([c, r]);
      if (ch === 'n') treats.push([c, r]); // nuts get the same reachability guarantees
    }
  if (!start) fail('no P spawn');
  if (!fam) fail('no F family');
  if (!treats.length) fail('no treats');
  if (failed) continue;

  const supported = (c, r) =>
    at(c, r) === 'H' || at(c, r) === '-' || solid(c, r + 1) || at(c, r + 1) === 'H';
  const touched = new Set();            // tiles passed through while falling
  const settle = (c, r) => {            // fall until something catches us
    touched.add(`${c},${r}`);
    while (r < ROWS - 1 && !supported(c, r)) { r++; touched.add(`${c},${r}`); }
    return [c, r];
  };
  const movesFrom = (c, r) => {
    const next = [];
    for (const dc of [-1, 1]) if (!solid(c + dc, r)) next.push(settle(c + dc, r));
    if (at(c, r) === 'H' && !solid(c, r - 1)) next.push([c, r - 1]);
    if (!solid(c, r + 1)) next.push(settle(c, r + 1));
    return next;
  };

  // forward BFS from Penny's spawn, recording the move graph
  const seen = new Set(), edges = new Map(), q = [settle(...start)];
  seen.add(q[0].join());
  while (q.length) {
    const [c, r] = q.shift();
    const k = `${c},${r}`;
    for (const n of movesFrom(c, r)) {
      const nk = n.join();
      if (!edges.has(nk)) edges.set(nk, new Set());
      edges.get(nk).add(k); // reversed edge
      if (!seen.has(nk)) { seen.add(nk); q.push(n); }
    }
  }

  for (const [c, r] of treats)
    if (!seen.has(`${c},${r}`) && !touched.has(`${c},${r}`)) fail(`treat at col ${c}, row ${r} unreachable`);
  const famKey = settle(...fam).join();
  if (!seen.has(famKey)) fail(`family at col ${fam[0]}, row ${fam[1]} unreachable`);

  // softlock check: every reachable spot must still be able to reach the family
  const canFinish = new Set([famKey]), q2 = [famKey];
  while (q2.length) {
    const k = q2.shift();
    for (const p of edges.get(k) || [])
      if (!canFinish.has(p)) { canFinish.add(p); q2.push(p); }
  }
  for (const k of seen)
    if (!canFinish.has(k)) fail(`softlock: spot at (col,row) ${k} cannot get back to the family`);

  // no-stranding check: every treat must be mutually reachable (in the spawn's
  // strongly-connected component), so no collection order can leave one
  // permanently out of reach — important for younger players.
  const spawnKey = settle(...start).join();
  const canReachSpawn = new Set([spawnKey]), q3 = [spawnKey];
  while (q3.length) {
    const k = q3.shift();
    for (const p of edges.get(k) || [])  // edges is the reversed graph
      if (!canReachSpawn.has(p)) { canReachSpawn.add(p); q3.push(p); }
  }
  for (const [c, r] of treats) {
    const k = `${c},${r}`;
    if (seen.has(k) && !canReachSpawn.has(k))
      fail(`treat at col ${c}, row ${r} is strandable (one-way: can be reached but not left)`);
  }
  // the family spot too: wandering to the couch early must never trap a player
  if (!canReachSpawn.has(famKey))
    fail(`family at col ${fam[0]}, row ${fam[1]} is a one-way pocket (player can get stuck there before the exit opens)`);
  if (!failed) console.log(`  OK — ${treats.length} treats, all reachable & none strandable`);
}
process.exit(anyFailed ? 1 : 0);
