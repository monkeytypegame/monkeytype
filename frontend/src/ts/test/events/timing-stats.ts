/**
 * Key timing statistics derived from an event log.
 *
 * Pure math with no ui or dom dependencies, so the same functions back both the
 * event log viewer and the offline report script that measures them across a
 * labelled corpus. Anything that only makes sense as a chart stays in the
 * viewer - what lives here is what an anticheat could eventually run on the two
 * arrays it receives.
 */

export type Significant = { r: number; sigmas: number };
export type QuantumFit = { periodMs: number; strength: number } | null;

export type DistStats = {
  n: number;
  min: number;
  p10: number;
  p50: number;
  p90: number;
  max: number;
  mean: number;
  sd: number;
  cv: number;
  // the two halves of the body, each relative to the median. kept apart rather
  // than summed because a mixed log - a generator for most of the test and a
  // real person for the rest - widens the upper half enough to hide a pinched
  // lower half. combined they read higher than a clean human while the lower
  // half alone still sits in generator territory
  spreadLow: number | null;
  spreadHigh: number | null;
  // correlation between each value and the one before it. the only thing here
  // that is not order invariant - every other stat is identical if the array is
  // shuffled. sigmas is how far from zero that sits under the independence
  // null, whose standard error is exactly 1/sqrt(n)
  autocorrelation: Significant | null;
  // runs above and below the median. exact null under independence, and it
  // catches clumping that lag-1 correlation can miss
  runsZ: number | null;
  // median of the last third over the first third. 1.00 is perfectly
  // stationary, which is what a generator is
  drift: number | null;
  // coarsest grid the values sit on. browsers coarsen performance.now() for
  // spectre reasons - chrome to 0.1ms, firefox to 1ms - so a fine quantum is
  // normal and 1ms is not by itself suspicious
  quantum: QuantumFit;
  // how many different values appear at all. a generator drawing from a small
  // hardcoded pool gives a tiny count even when it sits on no regular grid
  distinctCount: number;
  // excess kurtosis - the one shape axis the tail ratio cannot see, since a
  // bell and a flat slab both score exactly 1 there
  kurtosis: number | null;
  skew: number;
};

export type CrossStats = {
  lag0: Significant | null;
  lag1: Significant | null;
  overlapRate: number | null;
  overlapRunsZ: number | null;
};

// values above this multiple of the median are pauses, not typing
export const PAUSE_CUTOFF_MULTIPLE = 2.5;

/**
 * Lag-1 autocorrelation, computed on the logs of the values.
 *
 * Logging first because a single long pause has enormous leverage on a
 * covariance, and typing speed varies multiplicatively anyway.
 *
 * The sigma count is what makes this worth having: under independent draws the
 * standard error of r is exactly 1/sqrt(n), so "distinguishable from a
 * generator" is arithmetic rather than a threshold fitted to a handful of human
 * samples. Reads strongest in the exonerating direction - a large r proves the
 * data has memory, while a small one only fails to show it.
 */
export function computeAutocorrelation(values: number[]): Significant | null {
  // nulls keep the positions, so a dropped value breaks its pair rather than
  // silently making two non adjacent values look adjacent
  const logs = values.map((v) => (v > 0 ? Math.log(v) : null));
  const present = logs.filter((x): x is number => x !== null);
  if (present.length < 30) return null;

  const mean = present.reduce((a, b) => a + b, 0) / present.length;
  let numerator = 0;
  let denominator = 0;
  let pairs = 0;

  for (let i = 0; i < logs.length; i++) {
    const current = logs[i];
    if (current === undefined || current === null) continue;
    denominator += (current - mean) ** 2;
    const previous = i > 0 ? logs[i - 1] : undefined;
    if (previous !== undefined && previous !== null) {
      numerator += (current - mean) * (previous - mean);
      pairs++;
    }
  }

  if (denominator <= 0 || pairs < 30) return null;
  const r = numerator / denominator;

  return { r, sigmas: r * Math.sqrt(pairs) };
}

/**
 * Wald-Wolfowitz runs test on a binary series. Like the autocorrelation this
 * has an exact null under independence, so the z it returns is a real
 * significance rather than a fitted threshold.
 *
 * Negative z means fewer runs than chance - the series clumps, which is what
 * momentum looks like. Positive z means it alternates more than chance.
 */
export function runsZFromSigns(signs: boolean[]): number | null {
  const n = signs.length;
  if (n < 30) return null;

  const above = signs.filter(Boolean).length;
  const below = n - above;
  if (above === 0 || below === 0) return null;

  let runs = 1;
  for (let i = 1; i < n; i++) if (signs[i] !== signs[i - 1]) runs++;

  const expected = (2 * above * below) / n + 1;
  const variance =
    (2 * above * below * (2 * above * below - n)) / (n * n * (n - 1));
  if (variance <= 0) return null;

  return (runs - expected) / Math.sqrt(variance);
}

export function computeRunsZ(values: number[]): number | null {
  if (values.length < 30) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] as number;
  const signs: boolean[] = [];
  for (const value of values) {
    if (value === median) continue;
    signs.push(value > median);
  }
  return runsZFromSigns(signs);
}

/**
 * Median of the last third over the median of the first third. Humans drift -
 * warming up, tiring, settling - so a value sitting exactly on 1.00 means the
 * series is stationary, which is what a generator is by construction.
 */
export function computeDrift(values: number[]): number | null {
  if (values.length < 60) return null;
  const third = Math.floor(values.length / 3);
  const medianOf = (slice: number[]): number => {
    const sorted = [...slice].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] as number;
  };
  const first = medianOf(values.slice(0, third));
  if (first <= 0) return null;
  return medianOf(values.slice(-third)) / first;
}

/** Pearson correlation of the logs of two index aligned series. */
export function correlateLogs(xs: number[], ys: number[]): Significant | null {
  const logX: number[] = [];
  const logY: number[] = [];
  const n = Math.min(xs.length, ys.length);
  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const y = ys[i];
    if (x === undefined || y === undefined || x <= 0 || y <= 0) continue;
    logX.push(Math.log(x));
    logY.push(Math.log(y));
  }
  if (logX.length < 30) return null;

  const meanX = logX.reduce((a, b) => a + b, 0) / logX.length;
  const meanY = logY.reduce((a, b) => a + b, 0) / logY.length;
  let covariance = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < logX.length; i++) {
    const dx = (logX[i] as number) - meanX;
    const dy = (logY[i] as number) - meanY;
    covariance += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  if (varX <= 0 || varY <= 0) return null;

  const r = covariance / Math.sqrt(varX * varY);
  return { r, sigmas: r * Math.sqrt(logX.length) };
}

/**
 * Stats that only exist because the two arrays are index aligned: duration[i]
 * is the hold of key i and spacing[i] is the gap from key i to key i+1, so
 * both describe the same keypress.
 */
export function computeCrossStats(
  spacings: number[],
  durations: number[],
): CrossStats {
  // hold of a key against the gap that follows it, and against the gap that
  // preceded it. one shared speed state drives both, so a hand should show
  // correlation at more than one lag while a generator drawing the two arrays
  // separately is at zero everywhere
  const lag0 = correlateLogs(durations, spacings);
  const lag1 = correlateLogs(spacings, durations.slice(1));

  // key i is still down when key i+1 arrives iff it was held longer than the
  // gap. rollover comes in bursts, so this binary series should clump for a
  // hand and be independent for a generator
  const flags: boolean[] = [];
  for (let i = 0; i < spacings.length; i++) {
    const hold = durations[i];
    const gap = spacings[i];
    if (hold === undefined || gap === undefined || hold <= 0) continue;
    flags.push(hold > gap);
  }

  return {
    lag0,
    lag1,
    overlapRate:
      flags.length >= 1 ? flags.filter(Boolean).length / flags.length : null,
    overlapRunsZ: runsZFromSigns(flags),
  };
}

// swept rather than guessed. the range starts above sub-millisecond browser
// clock coarsening, which is present in every real log and not what we are
// looking for
const QUANTUM_MIN_MS = 0.5;
const QUANTUM_MAX_MS = 30;
const QUANTUM_COARSE_STEP = 0.02;
const QUANTUM_MIN_STRENGTH = 0.3;
// how far the peak has to stand above the rest of the sweep. absolute strength
// on its own is not enough: when the values barely vary, every period fits them
// and the whole sweep sits near 1, so the scan has no peak to find and just
// returns whatever the largest period tried was. two generated logs reported a
// confident "30ms grid" that way, which was only the top of the range. a real
// grid is a spike - the periods around it score near nothing
const QUANTUM_MIN_PROMINENCE = 4;

/**
 * How tightly the values cluster on a grid of the given period. This is the
 * Rayleigh statistic of the phases: 0 for values scattered anywhere, 1 for
 * values all sitting exactly on multiples of the period.
 */
export function combStrength(values: number[], period: number): number {
  let re = 0;
  let im = 0;
  for (const value of values) {
    const angle = (2 * Math.PI * value) / period;
    re += Math.cos(angle);
    im += Math.sin(angle);
  }
  return Math.hypot(re, im) / values.length;
}

/**
 * The grid the values sit on, found by sweeping every period rather than
 * testing a list of guesses. A fixed candidate list can only ever find periods
 * someone thought of in advance - a real log banded at ~6ms fell straight
 * through one and reported the browser's 0.1ms clock instead.
 */
export function detectQuantum(values: number[]): QuantumFit {
  if (values.length < 50) return null;

  // a grid coarser than the spread of the data is not something that can be
  // observed - there are not enough distinct values for the gaps between them
  // to mean anything, so any period that wide trivially fits
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length,
  );
  const maxPeriod = Math.min(QUANTUM_MAX_MS, sd);
  if (maxPeriod < QUANTUM_MIN_MS) return null;

  const scan: { periodMs: number; strength: number }[] = [];
  let peak = 0;
  for (
    let period = QUANTUM_MIN_MS;
    period <= maxPeriod;
    period += QUANTUM_COARSE_STEP
  ) {
    const strength = combStrength(values, period);
    scan.push({ periodMs: period, strength });
    if (strength > peak) peak = strength;
  }
  if (peak < QUANTUM_MIN_STRENGTH) return null;

  const typical = scan.map((e) => e.strength).sort((a, b) => a - b)[
    scan.length >> 1
  ] as number;
  if (peak < typical * QUANTUM_MIN_PROMINENCE) return null;

  // every harmonic of a grid scores as highly as the grid itself, so the
  // fundamental is the largest period still reaching the peak
  let fundamental = scan[0] as { periodMs: number; strength: number };
  for (const entry of scan) {
    if (entry.strength >= peak * 0.98) fundamental = entry;
  }

  let best = fundamental;
  for (
    let period = fundamental.periodMs - QUANTUM_COARSE_STEP;
    period <= fundamental.periodMs + QUANTUM_COARSE_STEP;
    period += 0.0005
  ) {
    const strength = combStrength(values, period);
    if (strength > best.strength) best = { periodMs: period, strength };
  }

  return best;
}

/**
 * Excess kurtosis over the typing values only. Pauses have to be filtered out
 * first: a fourth moment on the raw array is dominated by them, so the same
 * human sample reads anywhere from -0.04 to +8.9 depending on nothing but how
 * often they stopped to think. Filtered, the separation is clean - human key
 * timing lands positive and any bounded random range pins at -1.20.
 */
export function computeKurtosis(values: number[]): number | null {
  const positive = values.filter((v) => v > 0).sort((a, b) => a - b);
  const median = positive[Math.floor(positive.length / 2)];
  if (median === undefined) return null;

  const typing = positive.filter((v) => v < median * PAUSE_CUTOFF_MULTIPLE);
  if (typing.length < 8) return null;

  const mean = typing.reduce((a, b) => a + b, 0) / typing.length;
  const m2 = typing.reduce((a, b) => a + (b - mean) ** 2, 0) / typing.length;
  // a fixed interval generator has no spread to measure a shape in
  if (m2 < 1e-9) return null;
  const m4 = typing.reduce((a, b) => a + (b - mean) ** 4, 0) / typing.length;

  return m4 / m2 ** 2 - 3;
}

// Acklam's rational approximation to the inverse normal cdf
const PROBIT_A = [
  -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
  1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
] as const;
const PROBIT_B = [
  -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
  6.680131188771972e1, -1.328068155288572e1,
] as const;
const PROBIT_C = [
  -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
  -2.549732539343734, 4.374664141464968, 2.938163982698783,
] as const;
const PROBIT_D = [
  7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
  3.754408661907416,
] as const;

export function probit(p: number): number {
  const low = 0.02425;
  if (p < low || p > 1 - low) {
    const q = Math.sqrt(-2 * Math.log(p < low ? p : 1 - p));
    const value =
      (((((PROBIT_C[0] * q + PROBIT_C[1]) * q + PROBIT_C[2]) * q +
        PROBIT_C[3]) *
        q +
        PROBIT_C[4]) *
        q +
        PROBIT_C[5]) /
      ((((PROBIT_D[0] * q + PROBIT_D[1]) * q + PROBIT_D[2]) * q + PROBIT_D[3]) *
        q +
        1);
    return p < low ? value : -value;
  }
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((PROBIT_A[0] * r + PROBIT_A[1]) * r + PROBIT_A[2]) * r + PROBIT_A[3]) *
      r +
      PROBIT_A[4]) *
      r +
      PROBIT_A[5]) *
      q) /
    (((((PROBIT_B[0] * r + PROBIT_B[1]) * r + PROBIT_B[2]) * r + PROBIT_B[3]) *
      r +
      PROBIT_B[4]) *
      r +
      1)
  );
}

/**
 * How close the distribution is to a bell, as the correlation between the
 * sorted values and the quantiles a normal would have put them at. This is the
 * probability plot correlation coefficient - numerically what the eye does when
 * it judges whether a q-q plot is straight. 1.0 is exactly normal.
 *
 * Kurtosis is not a substitute for this even though it gets used as one. It is
 * a statement about tail weight, so it is driven by the few most extreme values
 * and says nothing about symmetry or about how many modes there are: a bimodal
 * distribution can sit at excess kurtosis 0 while looking nothing like a bell,
 * and one surviving outlier can send it to 119 while the body is unchanged.
 *
 * `useLogs` picks which scale the bell is expected on. Gaps between keys are
 * multiplicative and land near lognormal, so they are tested on their logs.
 * Hold times are roughly symmetric already and are tested as they are.
 */
export function computeBellness(
  values: number[],
  useLogs: boolean,
): number | null {
  const usable = useLogs
    ? values.filter((v) => v > 0).map((v) => Math.log(v))
    : values.filter((v) => v > 0);
  if (usable.length < 30) return null;

  const sorted = [...usable].sort((a, b) => a - b);
  const n = sorted.length;

  // Blom's plotting positions - the standard choice for a probability plot,
  // and what keeps the statistic comparable across sample sizes
  const expected = sorted.map((_, i) => probit((i + 1 - 0.375) / (n + 0.25)));

  const meanValue = sorted.reduce((a, b) => a + b, 0) / n;
  const meanExpected = expected.reduce((a, b) => a + b, 0) / n;
  let covariance = 0;
  let varValue = 0;
  let varExpected = 0;
  for (let i = 0; i < n; i++) {
    const dv = (sorted[i] as number) - meanValue;
    const de = (expected[i] as number) - meanExpected;
    covariance += dv * de;
    varValue += dv * dv;
    varExpected += de * de;
  }
  if (varValue <= 0 || varExpected <= 0) return null;

  return covariance / Math.sqrt(varValue * varExpected);
}

/**
 * The same bell test with pauses removed, so it describes the typing itself
 * rather than how often the typist stopped. Pauses are a genuine part of the
 * right tail, so both versions are worth having - they answer different
 * questions and a generator can fail either one.
 */
export function computeBellnessTyping(
  values: number[],
  useLogs: boolean,
): number | null {
  const positive = values.filter((v) => v > 0).sort((a, b) => a - b);
  const median = positive[Math.floor(positive.length / 2)];
  if (median === undefined) return null;
  return computeBellness(
    positive.filter((v) => v < median * PAUSE_CUTOFF_MULTIPLE),
    useLogs,
  );
}

export function computeDistStats(values: number[]): DistStats | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const quantile = (p: number): number =>
    sorted[Math.floor(p * (sorted.length - 1))] as number;

  const p10 = quantile(0.1);
  const p50 = quantile(0.5);
  const p90 = quantile(0.9);

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const m2 = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const m3 = values.reduce((a, b) => a + (b - mean) ** 3, 0) / values.length;
  const sd = Math.sqrt(m2);

  return {
    n: values.length,
    min: sorted[0] as number,
    p10,
    p50,
    p90,
    max: sorted[sorted.length - 1] as number,
    mean,
    sd,
    cv: mean > 0 ? sd / mean : 0,
    spreadLow: p50 > 0 ? (p50 - p10) / p50 : null,
    spreadHigh: p50 > 0 ? (p90 - p50) / p50 : null,
    autocorrelation: computeAutocorrelation(values),
    runsZ: computeRunsZ(values),
    drift: computeDrift(values),
    quantum: detectQuantum(values),
    distinctCount: new Set(values.map((v) => v.toFixed(3))).size,
    kurtosis: computeKurtosis(values),
    skew: m2 > 0 ? m3 / m2 ** 1.5 : 0,
  };
}
