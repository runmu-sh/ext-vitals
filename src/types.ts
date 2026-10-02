/**
 * The exported API of `@runmu.sh/ext-vitals` (`ctx.api('vitals')`) and the GMCP shapes it reads. The contract a
 * game author needs is the README; this file is its typed form.
 */
import type { WidgetSpec } from '@muclient/sdk';

/** A token name for a gauge fill. */
export type GaugeColor = NonNullable<WidgetSpec['color']>;

/** One vital: the keys that may carry its value and its maximum, the gauge label and its colour token. */
export type Pair = [cur: string[], max: string[], label: string, color: GaugeColor];

/** One gauge drawn for a session (`gaugesOf`, `api.gauges`). `order` is the gauge's place in the stack. */
export interface Gauge { label: string; value: number; max: number; color: GaugeColor; order: number }

/**
 * `Char.Vitals` as this extension reads it: an object of numbers (or numeric strings). Partial updates merge into
 * the session's state (the host keeps the reduced state), so `{ hp: 30 }` after a full message updates hp only.
 */
export type CharVitals = Record<string, number | string | null | undefined>;

/** What `ctx.api('vitals')` returns. */
export interface VitalsApi {
  /** The key table (the README's "Gauges"), in stack order. */
  pairs: Pair[];
  /** The gauges shown for a session now (default: the active one). @since 1.1.0 */
  gauges(sid?: string): Gauge[];
}
