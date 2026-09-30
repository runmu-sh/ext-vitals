// src/index.ts
import { defineExtension } from "@muclient/sdk";
var VITAL_PAIRS = [
  [["hp", "health"], ["maxhp", "maxhealth", "max_hp"], "hp", "accent"],
  [["mana", "mp", "sp"], ["maxmana", "maxmp", "maxsp", "max_mana"], "mana", "accent-bright"],
  [["ess", "essence"], ["maxess", "maxessence", "max_ess"], "ess", "gold"],
  [["moves", "mv", "stamina", "end", "endurance"], ["maxmoves", "maxmv", "maxstamina", "maxend", "maxendurance"], "mv", "ok"]
];
function gaugesOf(data) {
  if (!data || typeof data !== "object") return [];
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
    const apply = (data, sid) => {
      for (const g of gaugesOf(data)) {
        mu.widgets.show({ id: `vitals.${g.label}`, type: "gauge", label: g.label, value: g.value, max: g.max, color: g.color, dismissible: false, source: "vitals", order: g.order }, sid);
      }
    };
    mu.gmcp.on("Char", (data, { sid, pkg }) => {
      if (pkg.toLowerCase() === "char.vitals") apply(data, sid);
    });
    for (const s of mu.sessions.list()) {
      const d = mu.gmcp.state("Char.Vitals", s.id);
      if (d) apply(d, s.id);
    }
    return { pairs: VITAL_PAIRS };
  }
});
export {
  VITAL_PAIRS,
  index_default as default,
  gaugesOf
};
