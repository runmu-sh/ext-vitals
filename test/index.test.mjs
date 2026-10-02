/**
 * `npm test`: the extension in the headless μClient host (@runmu.sh/dev/test).
 *
 * μClient reduces `Char.Vitals` as a merge package (a partial message merges into the state, a new connection or
 * `Char.Name` resets it to nothing) and hands `gmcp.watch` the reduced state. The test host keeps the last message
 * only, so `vitals()` below feeds it the state μClient would hold, and `reset()` the `undefined` of a reset.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHost } from '@runmu.sh/dev/test';
import { load } from './load.mjs';

function setup(opts) {
  const host = createHost(opts);
  const merged = new Map();
  const vitals = (sid, data) => { const next = { ...(merged.get(sid) ?? {}), ...data }; merged.set(sid, next); host.gmcp(sid, 'Char.Vitals', next); };
  const reset = (sid) => { merged.delete(sid); host.gmcp(sid, 'Char.Vitals', undefined); };
  const gauges = (sid = 's1') => host.widgets(sid).map((w) => `${w.id}=${w.value}/${w.max}:${w.color}#${w.order}`).sort();
  return { host, vitals, reset, gauges };
}

test('gaugesOf: pairs need a value and a maximum; aliases; numeric strings', async () => {
  const { gaugesOf, gaugeId } = await load('src/index.ts');
  assert.equal(gaugeId('hp'), 'vitals.hp');
  assert.deepEqual(gaugesOf({ health: 5, maxhealth: 9, mp: 1 }), [{ label: 'hp', value: 5, max: 9, color: 'accent', order: 1 }]);
  assert.deepEqual(gaugesOf({ hp: '7', maxhp: '10', essence: 2, max_ess: 4, mv: 1, maxmv: 2 }).map((g) => [g.label, g.value, g.max, g.order]), [['hp', 7, 10, 1], ['ess', 2, 4, 3], ['mv', 1, 2, 4]]);
  assert.deepEqual(gaugesOf({ hp: 'x', maxhp: 3 }), []);
  assert.deepEqual(gaugesOf(null), []);
  assert.deepEqual(gaugesOf([1, 2]), []);
});

test('a full message shows one gauge per pair, in theme colours, not dismissible', async () => {
  const { host, vitals, gauges } = setup();
  await host.load('src/index.ts');
  vitals('s1', { hp: 30, maxhp: 42, mana: 3, maxmana: 9, ess: 18, maxess: 24 });
  assert.deepEqual(gauges(), ['vitals.ess=18/24:gold#3', 'vitals.hp=30/42:accent#1', 'vitals.mana=3/9:accent-bright#2']);
  const hp = host.widget('vitals.hp', 's1');
  assert.equal(hp.type, 'gauge');
  assert.equal(hp.label, 'hp');
  assert.equal(hp.dismissible, false);
  assert.equal(hp.source, 'vitals');
  await host.unload();
});

test('a partial update after a full message updates hp and keeps mana', async () => {
  const { host, vitals, gauges } = setup();
  await host.load('src/index.ts');
  vitals('s1', { hp: 30, maxhp: 42, mana: 3, maxmana: 9 });
  vitals('s1', { hp: 12 });
  assert.deepEqual(gauges(), ['vitals.hp=12/42:accent#1', 'vitals.mana=3/9:accent-bright#2']);
  await host.unload();
});

test('enabled with vitals already received: the gauges show once, from the state', async () => {
  const { host, vitals, gauges } = setup();
  vitals('s1', { hp: 30, maxhp: 42 });
  const ext = await host.load('src/index.ts');
  assert.deepEqual(gauges(), ['vitals.hp=30/42:accent#1']);
  assert.deepEqual(ext.api.gauges('s1').map((g) => g.label), ['hp']);
  await host.unload();
});

test('a reset (new connection, Char.Name) clears the gauges until the next message', async () => {
  const { host, vitals, reset, gauges } = setup();
  await host.load('src/index.ts');
  vitals('s1', { hp: 30, maxhp: 42, mv: 5, maxmv: 9 });
  reset('s1');
  assert.deepEqual(gauges(), []);
  vitals('s1', { hp: 40, maxhp: 42 });
  assert.deepEqual(gauges(), ['vitals.hp=40/42:accent#1']);
  await host.unload();
});

test('a pair that loses its values goes; the others stay', async () => {
  const { host, gauges } = setup();
  await host.load('src/index.ts');
  host.gmcp('s1', 'Char.Vitals', { hp: 30, maxhp: 42, mv: 5, maxmv: 9 });
  host.gmcp('s1', 'Char.Vitals', { hp: 30, maxhp: 42 }); // a game that sends whole objects and drops a stat
  assert.deepEqual(gauges(), ['vitals.hp=30/42:accent#1']);
  await host.unload();
});

test('per session: each session has its own gauges; a closed session drops them', async () => {
  const { host, vitals, gauges } = setup({ sessions: [{ id: 's1', worldId: 'w1' }, { id: 's2', worldId: 'w2' }] });
  const ext = await host.load('src/index.ts');
  vitals('s1', { hp: 1, maxhp: 2 });
  vitals('s2', { mana: 5, maxmana: 6 });
  assert.deepEqual(gauges('s1'), ['vitals.hp=1/2:accent#1']);
  assert.deepEqual(gauges('s2'), ['vitals.mana=5/6:accent-bright#2']);
  host.open({ id: 's3', worldId: 'w3' });
  vitals('s3', { ess: 1, maxess: 1 });
  assert.deepEqual(gauges('s3'), ['vitals.ess=1/1:gold#3']);
  host.close('s2');
  assert.deepEqual(ext.api.gauges('s2'), []);
  assert.deepEqual(ext.api.gauges('s1').map((g) => g.label), ['hp']);
  await host.unload();
});

test('the exported API: pairs and gauges(); nothing sent; everything released on disable', async () => {
  const { host, vitals } = setup();
  const ext = await host.load('src/index.ts');
  assert.ok(Array.isArray(ext.api.pairs) && ext.api.pairs.length === 4);
  assert.deepEqual(ext.api.pairs.map((p) => p[2]), ['hp', 'mana', 'ess', 'mv']);
  vitals('s1', { hp: 1, maxhp: 2 });
  assert.deepEqual(ext.api.gauges().map((g) => g.label), ['hp']);
  assert.deepEqual(host.sent, []);
  assert.deepEqual(host.errors, []);
  await host.unload();
  assert.deepEqual(host.live(), []);
  assert.deepEqual(host.widgets('s1'), []);
});
