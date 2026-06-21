# ★ PENNY RUNNER ★

*A Lode-Runner-style arcade adventure starring Penny, a Cavalier King Charles
Spaniel who is a very good dog.*

Penny has one mission: eat every treat in the backyard, then get home for
snuggle time with her family. Standing between her and the couch: ladders,
monkey bars, diggable bricks, and the most dangerous force known to dog-kind —
**squirrels**.

![Title screen](docs/title.png)
![Gameplay](docs/gameplay.png)

## How to play

Open `index.html` in any modern browser. No build step, no dependencies.
(Or serve it: `npx http-server .` and visit the printed URL.)

| Key | Action |
| --- | --- |
| ← → / A D | Run |
| ↑ ↓ / W S | Climb ladders, drop from bars |
| **Z** / **X** | Dig a hole to the left / right |
| **SPACE** | Give a nut to a squirrel — or a honeypot to the bear |
| M | Mute |
| R | Send Penny back to her start spot (costs a heart) |
| Enter | Start |
| 1–7 | Jump to a level (from the title screen) |

## The rules of being a good dog

- **Treats** — collect every biscuit on the level. 100 points apiece.
  Squirrels can't take them; every treat stays where it is until Penny
  eats it.
- **Squirrels** — they roam the level chasing Penny. **They are not
  friends: one touch costs Penny a life** (classic Lode Runner). Penny is
  much faster than they are on open ground, so kite them — and the HUD
  flashes a warning when one gets close. Squirrels are slowest on Level 1,
  to ease you in. Penny gets a brief flash of invulnerability each time
  she (re)spawns.
- **Nuts** — acorns scattered around each level (Penny can pocket up to 3).
  Press **SPACE** near a squirrel to give it one: it sprints away with its
  prize (+50) and sits down to munch for a good while — completely harmless
  until it finishes eating. If no squirrel is close enough, Penny keeps the
  nut.
- **The bear** (Levels 4–6) — a black bear that lumbers after Penny and
  **climbs ladders** to follow her between floors. It's **lethal on contact like
  the squirrels, and nuts do nothing to it**. It's slow on the ground and climbs
  slowly too, so Penny can always outrun it; lose it on the flats, or drop it in
  a hole (+200).
- **Honeypots** (Level 6) — the bear's weakness. Collect a honeypot (up to 2)
  and press **SPACE** near the bear to give it one: for several seconds the bear
  turns **friendly**, ignores Penny, and **chases the squirrels** instead,
  scaring any it catches back to their nests (+100 each). SPACE is smart — it
  feeds a nearby bear a honeypot if you have one, otherwise it bribes a squirrel
  with a nut.
- **Digging** — bricks (pink) can be dug through, Lode Runner style. Drop a
  squirrel into a hole to trap it (+75, +200 for the bear) — you can safely run
  across a trapped enemy's head. Holes refill after a few seconds, so don't get
  caught in one yourself; that costs a heart too.
- **Snuggle time** — once the last treat is eaten the family calls from the
  couch (or the lakeside dock). Get there for the snuggle bonus (faster =
  bigger) and the next level.

Seven levels: **Backyard Basics**, **Squirrel Park**, **The Big Dig**, the
Poconos-lakeside **Poconos Lake** (where the bear shows up), **Gigi & Babu's
House** (a cozy indoor room with the grandparents and three grandkids), **Theo's
House** — an Arsenal-decked bedroom with 4 squirrels, a bear and honeypots, where
Theo, his moms Emily & Amy, and Lolo, Issa & Laz wait in their kits — and the
finale **Harper & Isabel's House**, a Portugal-themed home (Portuguese flag,
azulejo walls, tins of sardines) with 5 squirrels and a bear, where Harper,
Isabel and their parents Angie & Jon are waiting. Press **1–7** on the title
screen to jump straight to any level. **Mackie**, the family's black pit bull
(she), waits beside the family at every finish line. Finish all seven to confirm
what we already knew: Penny is a very good dog.

### Made to be kid-friendly (ages ~7–12)

- **No timer** — explore and plan at your own pace.
- **5 lives**, and a death only sends Penny back to the start of the *current*
  level with her collected treats kept — squirrels reset and she reappears with
  a second of invulnerability.
- **Running out of lives retries the same level** with fresh lives (you're
  never thrown back to Level 1), and your score carries over.
- **Penny is faster than every squirrel** (and Level 1's lone squirrel is
  extra slow), so you can always outrun them on open ground.
- Every level is provably completable with basic moving and climbing — no
  digging required — and no treat can be permanently stranded (see
  `tools/validate-levels.mjs`).

## Development

- Everything is hand-rolled in `game.js` — pixel-art sprites defined as
  character grids, WebAudio bleeps, and a tile-based movement/AI sim on a
  28×16 grid. `index.html` supplies the 90s Memphis-pattern wrapper.
- `node tools/validate-levels.mjs` checks every level map: dimensions, legal
  tiles, and a movement-graph BFS proving all treats and the family couch are
  reachable from Penny's spawn with no softlock spots (digging never
  required).

© 1996 GOOD DOG SOFTWARE (in spirit)
