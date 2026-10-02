// src/index.ts
import { defineExtension } from "@muclient/sdk";
var VITAL_PAIRS = [
  [["hp", "health"], ["maxhp", "maxhealth", "max_hp"], "hp", "accent"],
  [["mana", "mp", "sp"], ["maxmana", "maxmp", "maxsp", "max_mana"], "mana", "accent-bright"],
  [["ess", "essence"], ["maxess", "maxessence", "max_ess"], "ess", "gold"],
  [["moves", "mv", "stamina", "end", "endurance"], ["maxmoves", "maxmv", "maxstamina", "maxend", "maxendurance"], "mv", "ok"]
];
var gaugeId = (label) => `vitals.${label}`;
function gaugesOf(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const d = data;
  const num = (k) => {
    const v = Number(d[k]);
    return d[k] !== void 0 && d[k] !== "" && d[k] !== null && Number.isFinite(v) ? v : void 0;
  };
  const out = [];
  let order = 0;
  for (const [cur, max, label, color] of VITAL_PAIRS) {
    order++;
    const ck = cur.find((k) => num(k) !== void 0);
    const mk = max.find((k) => num(k) !== void 0);
    if (ck && mk) out.push({ label, value: num(ck), max: num(mk), color, order });
  }
  return out;
}
var index_default = defineExtension({
  activate(ctx) {
    const mu = ctx.mu;
    const shown = /* @__PURE__ */ new Map();
    const apply = (sid, state) => {
      const next = gaugesOf(state);
      const keep = new Set(next.map((g) => g.label));
      for (const g of shown.get(sid) ?? []) if (!keep.has(g.label)) mu.widgets.close(gaugeId(g.label), sid);
      for (const g of next) {
        mu.widgets.show({ id: gaugeId(g.label), type: "gauge", label: g.label, value: g.value, max: g.max, color: g.color, dismissible: false, source: ctx.id, order: g.order }, sid);
      }
      if (next.length) shown.set(sid, next);
      else shown.delete(sid);
    };
    ctx.subscriptions.push(mu.sessions.each((s) => {
      const off = mu.gmcp.watch("Char.Vitals", (state) => apply(s.id, state), { sid: s.id });
      return () => {
        off();
        shown.delete(s.id);
      };
    }));
    const api = {
      pairs: VITAL_PAIRS,
      gauges: (sid) => {
        const s = sid ?? mu.sessions.active()?.id;
        return s ? (shown.get(s) ?? []).map((g) => ({ ...g })) : [];
      }
    };
    return api;
  }
});
export {
  VITAL_PAIRS,
  index_default as default,
  gaugeId,
  gaugesOf
};
