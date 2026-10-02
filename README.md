# Vitals (`@runmu.sh/ext-vitals`, id `vitals`)

Turns GMCP `Char.Vitals` into gauges: hp, mana, essence and moves, each a 1px-bordered bar in a theme colour with
`36/42` beside it, stacked at the top left of the session. Install it from Extensions → Discover; it runs in the
worlds it is enabled for. It sends nothing to the game and needs no permissions.

## GMCP contract
Declared in the manifest (`contributes.gmcp`, package `Char 1`, schema `schema/vitals.json`); a message that does
not match is refused before the extension sees it.

| Message | Direction | Payload |
|---|---|---|
| `Char.Vitals` | in | an object of numbers (or numeric strings, or `null`) |

These pairs become gauges, in this order:
| Gauge | Value keys | Max keys | Colour token |
|---|---|---|---|
| hp | `hp`, `health` | `maxhp`, `maxhealth`, `max_hp` | `--accent` |
| mana | `mana`, `mp`, `sp` | `maxmana`, `maxmp`, `maxsp`, `max_mana` | `--accent-bright` |
| ess | `ess`, `essence` | `maxess`, `maxessence`, `max_ess` | `--gold` |
| mv | `moves`, `mv`, `stamina`, `end`, `endurance` | `maxmoves`, `maxmv`, `maxstamina`, `maxend`, `maxendurance` | `--ok` |

- A pair needs both its value and its maximum.
- Partial updates merge: `{ "hp": 12 }` after a full message moves hp and keeps the rest.
- A new connection (or `Char.Name`) clears the gauges until the next `Char.Vitals`.
- Enabled mid-session, it draws the gauges from what the session already received.
- Each gauge is a widget `vitals.<label>` (`vitals.hp` …), type `gauge`, not dismissible, so other gauges
  (`ext-widgets`, other extensions) stack with these in one place.

## Exported API
Typed in `src/types.ts` (shipped with the package).

```ts
const vitals = await ctx.api<VitalsApi>('vitals');
vitals.pairs;          // the table above: [valueKeys, maxKeys, label, colour][]
vitals.gauges(sid?);   // the gauges shown for a session now: { label, value, max, color, order }[]  (1.1.0)
```

The module also exports `gaugesOf(data)` (the gauges for one payload), `gaugeId(label)` and `VITAL_PAIRS`.

## Develop
```sh
npm install
npm run build        # dist/index.js + manifest check
npm run typecheck
npm test             # the extension in the headless host (@runmu.sh/dev/test)
npm run dev          # dev server with hot reload
```
