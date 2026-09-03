import { isoDatePlusDays, type Conference } from './conference';
import { haversineKm, type GeoPoint } from './geo';
import type { FindConferencesArgs } from './find-conferences.schema';

export interface ConferenceResult extends Conference {
  /** Present only when the user's location is known. */
  readonly distanceKm?: number;
}

/** A chart-bindable count row. */
export interface GroupRow {
  readonly label: string;
  readonly value: number;
}

export interface FindConferencesContext {
  readonly confs: readonly Conference[];
  readonly me?: GeoPoint;
  readonly today: Date;
}

export interface FindConferencesResult {
  readonly confs: readonly ConferenceResult[];
  readonly byMonth?: readonly GroupRow[];
  readonly byTopic?: readonly GroupRow[];
}

/**
 * Trusts its arguments — they are validated against the schema at the tool boundary.
 * Grouping runs on the final result, so the rows always sum to `confs.length`.
 * Derived views come from here, never from the model.
 */
export function findConferences(
  args: FindConferencesArgs,
  ctx: FindConferencesContext,
): FindConferencesResult {
  const latest =
    args.withinDays === undefined ? undefined : isoDatePlusDays(ctx.today, args.withinDays);

  const me = ctx.me;
  const matching = ctx.confs
    .map((conf) => ({ conf, distanceKm: me === undefined ? undefined : haversineKm(me, conf) }))
    .filter((candidate) => matchesFilters(candidate, args, latest))
    .sort((a, b) => a.conf.date.localeCompare(b.conf.date));

  const limited = args.limit === undefined ? matching : matching.slice(0, args.limit);
  const confs = limited.map(toResult);

  if (args.groupBy === 'month') {
    return { confs, byMonth: countBy(confs, (conf) => conf.date.slice(0, 7)) };
  }
  if (args.groupBy === 'topic') {
    return { confs, byTopic: countBy(confs, (conf) => conf.topic) };
  }
  return { confs };
}

/**
 * Carries the **exact** distance. `nearKm` is decided on it and only the emitted
 * value is rounded — rounding first would let 300.4 km pass a 300 km radius.
 */
interface Candidate {
  readonly conf: Conference;
  readonly distanceKm?: number;
}

function toResult({ conf, distanceKm }: Candidate): ConferenceResult {
  if (distanceKm === undefined) return conf;
  return { ...conf, distanceKm: Math.round(distanceKm) };
}

function matchesFilters(
  { conf, distanceKm }: Candidate,
  args: FindConferencesArgs,
  latest: string | undefined,
): boolean {
  if (args.topic !== undefined && conf.topic !== args.topic) return false;
  if (latest !== undefined && conf.date > latest) return false;
  return withinRadius(distanceKm, args.nearKm);
}

function withinRadius(distanceKm: number | undefined, nearKm: number | undefined): boolean {
  if (nearKm === undefined) return true;
  // Ignored rather than treated as "no hits": the model may ask for "near me"
  // before the user has picked a city.
  if (distanceKm === undefined) return true;
  return distanceKm <= nearKm;
}

function countBy(
  confs: readonly ConferenceResult[],
  labelOf: (conf: ConferenceResult) => string,
): GroupRow[] {
  const counts = new Map<string, number>();
  for (const conf of confs) {
    const label = labelOf(conf);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
