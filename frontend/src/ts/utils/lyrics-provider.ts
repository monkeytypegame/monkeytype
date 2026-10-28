import { z } from "zod";

/**
 * Songs and lyrics come from LRCLIB (community database, no key needed). One
 * search request returns the songs including their lyrics, so showing a result
 * list needs no further requests.
 *
 * Extra details (year, genre, ...) come from Apple's public iTunes Search API
 * and are only loaded for the one song the user opens.
 *
 * Lyrics are fetched for the current user and are never stored by Monkeytype.
 * Both calls live in this file so a different source (or a backend proxy) can
 * replace them without touching the UI.
 */

const LRCLIB_SEARCH_URL = "https://lrclib.net/api/search";
const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";
const REQUEST_TIMEOUT_MS = 10_000;

// ---- polite LRCLIB client ----
//
// Follows LRCLIB's guidance: requests go out one after another with a short
// pause, and `Retry-After` (sent with 429 and 503) is honored, plus a little
// random jitter so many clients do not retry at the same moment.

/** pause between two requests, 200-500 ms */
const LRCLIB_GAP_MIN_MS = 200;
const LRCLIB_GAP_MAX_MS = 500;
/** used when a 429 / 503 has no (readable) Retry-After header */
const DEFAULT_BUSY_RETRY_AFTER_MS = 1000;
const DEFAULT_RATE_LIMIT_RETRY_AFTER_MS = 5000;
/** random extra wait of up to 30% of the delay */
const JITTER_RATIO = 0.3;
const MAX_BUSY_RETRIES = 3;
/** a 429 is rarer and a sign to slow down: one retry, then tell the user */
const MAX_RATE_LIMIT_RETRIES = 1;
/** a longer wait is not done automatically, the user is told instead */
const MAX_AUTO_RETRY_WAIT_MS = 10_000;

export type LyricsTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  lyrics: string;
};

export type TrackInfo = {
  album: string | undefined;
  genre: string | undefined;
  year: number | undefined;
  artworkUrl: string | undefined;
};

export class RateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(retryAfterMs = 0) {
    super("LRCLIB is limiting requests, try again in a moment");
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

export class ServerBusyError extends Error {
  readonly retryAfterMs: number;

  constructor(retryAfterMs = 0) {
    super("LRCLIB is busy, try again in a moment");
    this.name = "ServerBusyError";
    this.retryAfterMs = retryAfterMs;
  }
}

/** waits, and stops early when the signal is aborted */
export async function abortableSleep(
  ms: number,
  signal?: AbortSignal,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted === true) {
      reject(signal.reason);
      return;
    }
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** `Retry-After` in seconds (LRCLIB) */
function parseRetryAfterMs(header: string | null): number | undefined {
  if (header === null) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}

function withJitter(ms: number): number {
  return Math.round(ms * (1 + Math.random() * JITTER_RATIO));
}

// all LRCLIB requests wait for their turn in this queue
let queueTail: Promise<void> = Promise.resolve();
let nextRequestAt = 0;
let blockedUntil = 0;

/** forgets queued state (for tests) */
export function resetLrclibQueue(): void {
  queueTail = Promise.resolve();
  nextRequestAt = 0;
  blockedUntil = 0;
}

async function inQueue<T>(
  task: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const result = queueTail.then(async () => {
    signal?.throwIfAborted();
    for (;;) {
      const waitMs = Math.max(nextRequestAt, blockedUntil) - Date.now();
      if (waitMs <= 0) break;
      await abortableSleep(waitMs, signal);
    }
    try {
      return await task();
    } finally {
      const gap =
        LRCLIB_GAP_MIN_MS +
        Math.random() * (LRCLIB_GAP_MAX_MS - LRCLIB_GAP_MIN_MS);
      nextRequestAt = Date.now() + gap;
    }
  });
  queueTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function lrclibRequest(
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return inQueue(async () => {
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const response = await fetch(url, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });

    if (response.status === 429 || response.status === 503) {
      const rateLimited = response.status === 429;
      const retryAfterMs =
        parseRetryAfterMs(response.headers.get("retry-after")) ??
        (rateLimited
          ? DEFAULT_RATE_LIMIT_RETRY_AFTER_MS
          : DEFAULT_BUSY_RETRY_AFTER_MS);
      // nothing is sent until then, not even by other callers
      blockedUntil = Math.max(
        blockedUntil,
        Date.now() + withJitter(retryAfterMs),
      );
      throw rateLimited
        ? new RateLimitError(retryAfterMs)
        : new ServerBusyError(retryAfterMs);
    }
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return (await response.json()) as unknown;
  }, signal);
}

const LrclibResponseSchema = z.array(
  z.object({
    id: z.number(),
    trackName: z.string().nullable().optional(),
    artistName: z.string().nullable().optional(),
    albumName: z.string().nullable().optional(),
    instrumental: z.boolean().nullable().optional(),
    plainLyrics: z.string().nullable().optional(),
  }),
);

const ItunesResponseSchema = z.object({
  results: z.array(
    z.object({
      trackName: z.string().optional(),
      artistName: z.string().optional(),
      collectionName: z.string().optional(),
      primaryGenreName: z.string().optional(),
      releaseDate: z.string().optional(),
      artworkUrl100: z.string().optional(),
    }),
  ),
});

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const response = await fetch(url, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

/**
 * @returns lyrics of found songs, best matches first
 * @throws RateLimitError if LRCLIB answers with 429
 * @throws ServerBusyError if LRCLIB keeps answering with 503
 */
export async function searchTracks(
  query: string,
  signal?: AbortSignal,
): Promise<LyricsTrack[]> {
  const q = query.trim();
  if (q === "") return [];

  const url = `${LRCLIB_SEARCH_URL}?${new URLSearchParams({ q })}`;
  let json: unknown;
  for (let attempt = 0; ; attempt++) {
    try {
      json = await lrclibRequest(url, signal);
      break;
    } catch (e) {
      // the wait itself is done by the queue (Retry-After + jitter)
      const retryable =
        (e instanceof ServerBusyError && attempt < MAX_BUSY_RETRIES) ||
        (e instanceof RateLimitError &&
          attempt < MAX_RATE_LIMIT_RETRIES &&
          e.retryAfterMs <= MAX_AUTO_RETRY_WAIT_MS);
      if (!retryable) throw e;
    }
  }
  const parsed = LrclibResponseSchema.safeParse(json ?? []);
  if (!parsed.success) return [];

  const seen = new Set<string>();
  const tracks: LyricsTrack[] = [];
  for (const r of parsed.data) {
    const lyrics = r.plainLyrics?.trim() ?? "";
    const title = r.trackName?.trim() ?? "";
    const artist = r.artistName?.trim() ?? "";
    if (r.instrumental === true || lyrics === "" || title === "") continue;
    if (artist === "") continue;

    // the same song is often uploaded several times
    const key = `${title}|${artist}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    tracks.push({
      id: String(r.id),
      title,
      artist,
      album: r.albumName?.trim() ?? "",
      lyrics,
    });
  }
  return tracks;
}

// ---- details from iTunes ----

const infoCache = new Map<string, TrackInfo | null>();

/** forgets cached details (for tests) */
export function clearTrackInfoCache(): void {
  infoCache.clear();
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function parseYear(releaseDate: string | undefined): number | undefined {
  if (releaseDate === undefined) return undefined;
  const year = new Date(releaseDate).getUTCFullYear();
  return Number.isNaN(year) ? undefined : year;
}

/**
 * Looks the song up on iTunes. iTunes can only search by text, so this takes
 * the best title / artist match.
 * @returns `null` if iTunes does not know the song
 */
export async function fetchTrackInfo(
  track: LyricsTrack,
  signal?: AbortSignal,
): Promise<TrackInfo | null> {
  const cached = infoCache.get(track.id);
  if (cached !== undefined) return cached;

  const params = new URLSearchParams({
    term: `${track.title} ${track.artist}`,
    media: "music",
    entity: "song",
    limit: "10",
  });
  const json = await fetchJson(`${ITUNES_SEARCH_URL}?${params}`, signal);
  const parsed = ItunesResponseSchema.safeParse(json);

  const title = normalize(track.title);
  const artist = normalize(track.artist);
  const match = parsed.success
    ? parsed.data.results.find((r) => {
        const t = normalize(r.trackName ?? "");
        const a = normalize(r.artistName ?? "");
        return (
          t !== "" &&
          a !== "" &&
          (t === title || t.startsWith(title) || title.startsWith(t)) &&
          (a.includes(artist) || artist.includes(a))
        );
      })
    : undefined;

  const info: TrackInfo | null =
    match === undefined
      ? null
      : {
          album: match.collectionName,
          genre: match.primaryGenreName,
          year: parseYear(match.releaseDate),
          artworkUrl: match.artworkUrl100,
        };
  infoCache.set(track.id, info);
  return info;
}
