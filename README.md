# Vitals (`@runmu.sh/ext-vitals`, id `vitals`)

First-party extension on the marketplace (`vitals`, R-UIC). Install it from Extensions → Discover; when enabled for a world it turns `Char.Vitals` into floating gauges through `mu.widgets.show` (source `vitals`). Before this it lived in the world-panels core. Other `showWidget` gauges (from GMCP `Client.Widget` or the SDK) are unaffected.

## GMCP contract
`Char.Vitals` (the name is case-insensitive) is an object of numbers. These pairs become gauges, in this order:
| Gauge | Value keys | Max keys | Colour token |
|---|---|---|---|
| hp | `hp`, `health` | `maxhp`, `maxhealth`, `max_hp` | `--accent` |
| mana | `mana`, `mp`, `sp` | `maxmana`, `maxmp`, `maxsp`, `max_mana` | `--accent-bright` |
| ess | `ess`, `essence` | `maxess`, `maxessence`, `max_ess` | `--gold` |
| mv | `moves`, `mv`, `stamina`, `end`, `endurance` | `maxmoves`, `maxmv`, `maxstamina`, `maxend`, `maxendurance` | `--ok` |

A pair needs both the value and the max. The last `Char.Vitals` a session received is replayed when the extension is enabled. It sends nothing to the server.

## API
`ctx.api('vitals')` returns `{ pairs }` (the table above). `gaugesOf(data)` is exported for tests.

## What it looks like
A 220px stack at the top left of the session (z 60), with one row per gauge: a lowercase label, a 1px-bordered bar filled with the token colour, and `36/42`. Disabling the extension removes the stack.
