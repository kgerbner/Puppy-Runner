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
| M | Mute |
| R | Send Penny back to her start spot (costs a heart) |
| Enter | Start |

## The rules of being a good dog

- **Treats** — collect every biscuit on the level. 100 points apiece.
- **Squirrels** — they roam the level, swipe unattended treats, and worst of
  all, they're *fascinating*. Linger near one and the **SQUIRREL METER**
  fills; when it maxes out Penny loses her mind and chases the squirrel,
  controls be darned. Catching up to one earns a **BOOP** (+25), the squirrel
  drops whatever it stole, and Penny feels *focused* for a while.
- **Digging** — bricks (pink) can be dug through, Lode Runner style. Holes
  refill after a few seconds. Trap a squirrel for +75, but don't get caught
  in a refilling hole yourself — that costs a heart.
- **Snuggle time** — once the last treat is eaten the family calls from the
  couch. Get there for the snuggle bonus (faster = bigger) and the next level.

Three levels: **Backyard Basics**, **Squirrel Park**, and **The Big Dig**.
Finish all three to confirm what we already knew: Penny is a very good dog.

## Development

- Everything is hand-rolled in `game.js` — pixel-art sprites defined as
  character grids, WebAudio bleeps, and a tile-based movement/AI sim on a
  28×16 grid. `index.html` supplies the 90s Memphis-pattern wrapper.
- `node tools/validate-levels.mjs` checks every level map: dimensions, legal
  tiles, and a movement-graph BFS proving all treats and the family couch are
  reachable from Penny's spawn with no softlock spots (digging never
  required).

© 1996 GOOD DOG SOFTWARE (in spirit)
