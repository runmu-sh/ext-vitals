# Changelog

## 1.1.0

- Partial `Char.Vitals` updates now merge: a game that sends only `{ "hp": 12 }` moves the hp gauge and keeps the others.
- A new connection clears the gauges until the game sends vitals again, instead of showing the last character's.
- Gauges for each session are kept apart and drawn once when the extension is enabled mid-session.
- Needs no permissions any more (it never read game output).
- Messages that are not an object of numbers are refused before they reach the gauges.
- New: `ctx.api('vitals').gauges(sid)` lists the gauges a session shows; the API is typed in `src/types.ts`.

## 1.0.1

- Its own repository, [runmu-sh/ext-vitals](https://github.com/runmu-sh/ext-vitals), made with `npm create @runmu.sh/extension` and published to the marketplace from its version tags. The package is `@runmu.sh/ext-vitals`, built against `@runmu.sh/sdk` from npm. Nothing changes in the extension itself.

## 1.0.0

- Published to the marketplace as `vitals`; no longer bundled with μClient. Char.Vitals gauges through `mu.widgets.show`, moved out of the μClient core.
