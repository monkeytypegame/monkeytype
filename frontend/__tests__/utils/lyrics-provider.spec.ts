import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearTrackInfoCache,
  fetchTrackInfo,
  RateLimitError,
  resetLrclibQueue,
  searchTracks,
  ServerBusyError,
  type LyricsTrack,
} from "../../src/ts/utils/lyrics-provider";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const track = (over: Partial<LyricsTrack> = {}): LyricsTrack => ({
  id: "1",
  title: "Song",
  artist: "Artist",
  album: "Album",
  lyrics: "la la",
  ...over,
});

beforeEach(() => {
  resetLrclibQueue();
  clearTrackInfoCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("lyrics-provider", () => {
  describe("searchTracks", () => {
    it("maps results with lyrics and uses a single request", async () => {
      const fetchMock = vi.fn().mockImplementation(async () =>
        jsonResponse([
          {
            id: 7,
            trackName: " A ",
            artistName: "X",
            albumName: "Alb",
            plainLyrics: " hello\nworld ",
          },
        ]),
      );
      vi.stubGlobal("fetch", fetchMock);

      expect(await searchTracks("  a  ")).toEqual([
        {
          id: "7",
          title: "A",
          artist: "X",
          album: "Alb",
          lyrics: "hello\nworld",
        },
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = new URL(fetchMock.mock.calls[0]?.[0] as string);
      expect(url.pathname).toBe("/api/search");
      expect(url.searchParams.get("q")).toBe("a");
    });

    it("drops instrumentals, songs without lyrics and duplicates", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () =>
          jsonResponse([
            { id: 1, trackName: "A", artistName: "X", plainLyrics: null },
            {
              id: 2,
              trackName: "B",
              artistName: "X",
              instrumental: true,
              plainLyrics: "la",
            },
            { id: 3, trackName: "C", artistName: "X", plainLyrics: "words" },
            { id: 4, trackName: "c", artistName: "x", plainLyrics: "again" },
            { id: 5, trackName: "D", artistName: null, plainLyrics: "words" },
          ]),
        ),
      );
      const found = await searchTracks("x");
      expect(found.map((t) => t.id)).toEqual(["3"]);
    });

    it("does not call the network for an empty query", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      expect(await searchTracks("   ")).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("treats a 404 as no results", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () => jsonResponse({}, 404)),
      );
      expect(await searchTracks("a")).toEqual([]);
    });

    it("throws RateLimitError on 429", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(
          async () =>
            new Response("", {
              status: 429,
              headers: { "retry-after": "60" },
            }),
        ),
      );
      await expect(searchTracks("a")).rejects.toBeInstanceOf(RateLimitError);
    });

    describe("rate limit and busy server", () => {
      beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(Math, "random").mockReturnValue(0); // no jitter, shortest gap
      });
      afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
      });

      const withHeader = (status: number, retryAfter?: string): Response =>
        new Response(JSON.stringify({ message: "x" }), {
          status,
          headers:
            retryAfter === undefined ? {} : { "retry-after": retryAfter },
        });
      const hit = (): Response =>
        jsonResponse([
          { id: 1, trackName: "A", artistName: "X", plainLyrics: "w" },
        ]);

      it("503: waits for Retry-After, then succeeds", async () => {
        const fetchMock = vi
          .fn()
          .mockResolvedValueOnce(withHeader(503, "2"))
          .mockResolvedValueOnce(hit());
        vi.stubGlobal("fetch", fetchMock);

        const result = searchTracks("a");
        await vi.advanceTimersByTimeAsync(1900);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(300);
        expect(await result).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });

      it("503 without a readable header waits one second", async () => {
        const fetchMock = vi
          .fn()
          .mockResolvedValueOnce(withHeader(503))
          .mockResolvedValueOnce(hit());
        vi.stubGlobal("fetch", fetchMock);

        const result = searchTracks("a");
        await vi.advanceTimersByTimeAsync(900);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(200);
        await result;
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });

      it("adds up to 30% jitter to the wait", async () => {
        vi.spyOn(Math, "random").mockReturnValue(1);
        const fetchMock = vi
          .fn()
          .mockResolvedValueOnce(withHeader(503, "10"))
          .mockResolvedValueOnce(hit());
        vi.stubGlobal("fetch", fetchMock);

        const result = searchTracks("a");
        await vi.advanceTimersByTimeAsync(12_900);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(200);
        await result;
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });

      it("503: gives up with ServerBusyError after the retries", async () => {
        const fetchMock = vi
          .fn()
          .mockImplementation(async () => withHeader(503, "1"));
        vi.stubGlobal("fetch", fetchMock);

        const result = searchTracks("a");
        const assertion =
          expect(result).rejects.toBeInstanceOf(ServerBusyError);
        await vi.advanceTimersByTimeAsync(30_000);
        await assertion;
        expect(fetchMock).toHaveBeenCalledTimes(4); // first try + 3 retries
      });

      it("429: a short Retry-After is waited for and retried", async () => {
        const fetchMock = vi
          .fn()
          .mockResolvedValueOnce(withHeader(429, "3"))
          .mockResolvedValueOnce(hit());
        vi.stubGlobal("fetch", fetchMock);

        const result = searchTracks("a");
        await vi.advanceTimersByTimeAsync(3500);
        expect(await result).toHaveLength(1);
      });

      it("429: a long Retry-After is not waited for, the user is told", async () => {
        const fetchMock = vi
          .fn()
          .mockImplementation(async () => withHeader(429, "60"));
        vi.stubGlobal("fetch", fetchMock);

        await expect(searchTracks("a")).rejects.toMatchObject({
          name: "RateLimitError",
          retryAfterMs: 60_000,
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });

      it("sends nothing while a Retry-After pause is running, not even other searches", async () => {
        const fetchMock = vi
          .fn()
          .mockResolvedValueOnce(withHeader(429, "60"))
          .mockImplementation(async () => hit());
        vi.stubGlobal("fetch", fetchMock);

        await expect(searchTracks("a")).rejects.toBeInstanceOf(RateLimitError);
        const next = searchTracks("b");
        await vi.advanceTimersByTimeAsync(59_000);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(2000);
        await next;
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });

      it("sends requests one at a time with a 200-500 ms pause", async () => {
        let running = 0;
        let maxRunning = 0;
        const times: number[] = [];
        const fetchMock = vi.fn().mockImplementation(async () => {
          running++;
          maxRunning = Math.max(maxRunning, running);
          times.push(Date.now());
          await new Promise((resolve) => setTimeout(resolve, 100));
          running--;
          return hit();
        });
        vi.stubGlobal("fetch", fetchMock);

        const all = Promise.all([
          searchTracks("a"),
          searchTracks("b"),
          searchTracks("c"),
        ]);
        await vi.advanceTimersByTimeAsync(2000);
        await all;
        expect(maxRunning).toBe(1);
        expect(times).toHaveLength(3);
        // finished after 100 ms, then the shortest pause (Math.random = 0)
        expect((times[1] ?? 0) - (times[0] ?? 0)).toBe(300);
        expect((times[2] ?? 0) - (times[1] ?? 0)).toBe(300);
      });

      it("a search that was replaced while waiting is never sent", async () => {
        const fetchMock = vi.fn().mockImplementation(async () => hit());
        vi.stubGlobal("fetch", fetchMock);

        await searchTracks("first"); // makes the next one wait for the pause
        const controller = new AbortController();
        const second = searchTracks("second", controller.signal);
        const assertion = expect(second).rejects.toThrow("stop");
        await vi.advanceTimersByTimeAsync(50);
        controller.abort(new Error("stop"));
        await assertion;
        await vi.advanceTimersByTimeAsync(1000);
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });
    });

    it("throws on other http errors", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () => jsonResponse({}, 500)),
      );
      await expect(searchTracks("a")).rejects.toThrow("500");
    });
  });

  describe("fetchTrackInfo", () => {
    const itunes = {
      results: [
        { trackName: "Other", artistName: "Someone" },
        {
          trackName: "Song (Remastered)",
          artistName: "Artist & Friends",
          collectionName: "Greatest",
          primaryGenreName: "Rock",
          releaseDate: "1999-05-04T07:00:00Z",
          artworkUrl100: "http://img",
        },
      ],
    };

    it("picks the matching iTunes song", async () => {
      const fetchMock = vi
        .fn()
        .mockImplementation(async () => jsonResponse(itunes));
      vi.stubGlobal("fetch", fetchMock);

      expect(await fetchTrackInfo(track())).toEqual({
        album: "Greatest",
        genre: "Rock",
        year: 1999,
        artworkUrl: "http://img",
      });
      const url = new URL(fetchMock.mock.calls[0]?.[0] as string);
      expect(url.searchParams.get("term")).toBe("Song Artist");
    });

    it("returns null if nothing matches", async () => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockImplementation(async () =>
            jsonResponse({ results: itunes.results.slice(0, 1) }),
          ),
      );
      expect(await fetchTrackInfo(track())).toBeNull();
    });

    it("asks iTunes only once per song", async () => {
      const fetchMock = vi
        .fn()
        .mockImplementation(async () => jsonResponse(itunes));
      vi.stubGlobal("fetch", fetchMock);
      await fetchTrackInfo(track());
      await fetchTrackInfo(track());
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not cache errors", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({}, 500))
        .mockResolvedValueOnce(jsonResponse(itunes));
      vi.stubGlobal("fetch", fetchMock);
      await expect(fetchTrackInfo(track())).rejects.toThrow("500");
      expect((await fetchTrackInfo(track()))?.genre).toBe("Rock");
    });
  });
});
