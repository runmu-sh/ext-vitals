/**
 * @runmu.sh/ext-vitals: GMCP `Char.Vitals` → gauges on the host's widget layer (`mu.widgets`), the counterpart of
 * the gauges a game draws with Underspire's `ui_component { type: "gauge" }`.
 *
 * One watch per in-scope session (`mu.sessions.each` + `mu.gmcp.watch`) on the host's reduced state: `Char.Vitals`
 * is a merge package, so a partial `{ hp: 30 }` after a full message updates hp and keeps the rest, and a new
 * connection (or `Char.Name`) resets it, which clears the gauges. A late activation or a reconnect is covered by
 * the watch's first call (the current state), so nothing is applied twice.
 *
 * Why `mu.widgets` and not `mu.hud`: a gauge is one of the host's built-in widget renderers (the `.uic.gauge`
 * look, the 220px stack top-left, the `widget-vitals.<label>` test ids), and gauges from other sources
 * (`ext-widgets`, other extensions) stack with these in one place. `mu.hud` is for surfaces the host has no
 * renderer for.
 */
import { defineExtension, type Mu } from '@muclient/sdk';
import type { Gauge, Pair, VitalsApi } from './types';

export type { Gauge, Pair, VitalsApi, CharVitals, GaugeColor } from './types';

export const VITAL_PAIRS: Pair[] = [
  [['hp', 'health'], ['maxhp', 'maxhealth', 'max_hp'], 'hp', 'accent'],
  [['mana', 'mp', 'sp'], ['maxmana', 'maxmp', 'maxsp', 'max_mana'], 'mana', 'accent-bright'],
  [['ess', 'essence'], ['maxess', 'maxessence', 'max_ess'], 'ess', 'gold'],
  [['moves', 'mv', 'stamina', 'end', 'endurance'], ['maxmoves', 'maxmv', 'maxstamina', 'maxend', 'maxendurance'], 'mv', 'ok'],
];

/** The widget id of a gauge. */
export const gaugeId = (label: string) => `vitals.${label}`;

/** The gauges for one Char.Vitals payload, in stack order. A pair needs both its value and its maximum. */
export function gaugesOf(data: unknown): Gauge[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  const d = data as Record<string, unknown>;
  const num = (k: string) => { const v = Number(d[k]); return d[k] !== undefined && d[k] !== '' && d[k] !== null && Number.isFinite(v) ? v : undefined; };
  const out: Gauge[] = [];
  let order = 0;
  for (const [cur, max, label, color] of VITAL_PAIRS) {
    order++;
    const ck = cur.find((k) => num(k) !== undefined);
    const mk = max.find((k) => num(k) !== undefined);
    if (ck && mk) out.push({ label, value: num(ck)!, max: num(mk)!, color, order });
  }
  return out;
}

export default defineExtension({
  activate(ctx) {
    const mu: Mu = ctx.mu;
    /** sid → the gauges shown for it (per session; dropped when the session leaves scope). */
    const shown = new Map<string, Gauge[]>();

    const apply = (sid: string, state: unknown) => {
      const next = gaugesOf(state);
      const keep = new Set(next.map((g) => g.label));
      for (const g of shown.get(sid) ?? []) if (!keep.has(g.label)) mu.widgets.close(gaugeId(g.label), sid);
      for (const g of next) {
        mu.widgets.show({ id: gaugeId(g.label), type: 'gauge', label: g.label, value: g.value, max: g.max, color: g.color, dismissible: false, source: ctx.id, order: g.order }, sid);
      }
      if (next.length) shown.set(sid, next); else shown.delete(sid);
    };

    ctx.subscriptions.push(mu.sessions.each((s) => {
      // `undefined` when the state resets (a new connection, Char.Name): the gauges go until the next message.
      const off = mu.gmcp.watch('Char.Vitals', (state) => apply(s.id, state), { sid: s.id });
      return () => { off(); shown.delete(s.id); };
    }));

    const api: VitalsApi = {
      pairs: VITAL_PAIRS,
      gauges: (sid) => {
        const s = sid ?? mu.sessions.active()?.id;
        return s ? (shown.get(s) ?? []).map((g) => ({ ...g })) : [];
      },
    };
    return api;
  },
});
