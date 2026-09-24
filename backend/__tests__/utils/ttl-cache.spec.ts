import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cacheWithTTL } from "../../src/utils/ttl-cache";

describe("cacheWithTTL", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("refetches after the ttl", async () => {
    const fn = vi.fn(async () => Date.now());
    const cache = cacheWithTTL(1000, fn);

    expect(await cache()).toBe(10_000);
    vi.advanceTimersByTime(500);
    expect(await cache()).toBe(10_000);
    vi.advanceTimersByTime(600);
    expect(await cache()).toBe(11_100);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("keeps the stale value until the ttl when the fetch fails", async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("first")
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce("third");
    const cache = cacheWithTTL(1000, fn);

    expect(await cache()).toBe("first");
    vi.advanceTimersByTime(1100);
    await expect(cache()).rejects.toThrow("down");
    expect(await cache()).toBe("first");
    expect(fn).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1100);
    expect(await cache()).toBe("third");
  });

  it("shares one fetch between concurrent calls", async () => {
    let resolve!: (value: string) => void;
    const fn = vi.fn(
      async () =>
        new Promise<string>((res) => {
          resolve = res;
        }),
    );
    const cache = cacheWithTTL(1000, fn);

    const a = cache();
    const b = cache();
    resolve("value");

    expect(await a).toBe("value");
    expect(await b).toBe("value");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
