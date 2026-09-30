/**
 * @runmu.sh/ext-vitals: GMCP Char.Vitals → gauges on the widget layer (R-UIC). Moved out of the
 * world-panels feature onto the SDK (`mu.gmcp.on` + `mu.widgets.show`). Each known pair (current and
 * maximum, under the usual key spellings) becomes one gauge `vitals.<label>`; the gauges go when the
 * extension is disabled. `activate` returns `{ pairs }` (the mapping) for other extensions.
 */
import { defineExtension, type Mu, type WidgetSpec } from '@muclient/sdk';

type Pair = [cur: string[], max: string[], label: string, color: NonNullable<WidgetSpec['color']>];
export const VITAL_PAIRS: Pair[] = [
  [['hp', 'health'], ['maxhp', 'maxhealth', 'max_hp'], 'hp', 'accent'],
  [['mana', 'mp', 'sp'], ['maxmana', 'maxmp', 'maxsp', 'max_mana'], 'mana', 'accent-bright'],
  [['ess', 'essence'], ['maxess', 'maxessence', 'max_ess'], 'ess', 'gold'],
  [['moves', 'mv', 'stamina', 'end', 'endurance'], ['maxmoves', 'maxmv', 'maxstamina', 'maxend', 'maxendurance'], 'mv', 'ok'],
];

/** The gauges for one Char.Vitals payload: [label, value, max, color, order]. Exported for tests. */
export function gaugesOf(data: unknown): Array<{ label: string; value: number; max: number; color: Pair[3]; order: number }> {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  const num = (k: string) => { const v = Number(d[k]); return d[k] !== undefined && d[k] !== '' && d[k] !== null && Number.isFinite(v) ? v : undefined; };
  const out = [];
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
    const apply = (data: unknown, sid: string) => {
      for (const g of gaugesOf(data)) {
        mu.widgets.show({ id: `vitals.${g.label}`, type: 'gauge', label: g.label, value: g.value, max: g.max, color: g.color, dismissible: false, source: 'vitals', order: g.order }, sid);
      }
    };
    // GMCP package names are case-insensitive: take the whole Char namespace and match here.
    mu.gmcp.on('Char', (data, { sid, pkg }) => { if (pkg.toLowerCase() === 'char.vitals') apply(data, sid); });
    // Vitals that arrived before the extension was enabled.
    for (const s of mu.sessions.list()) { const d = mu.gmcp.state('Char.Vitals', s.id); if (d) apply(d, s.id); }
    return { pairs: VITAL_PAIRS };
  },
});
