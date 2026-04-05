import fs from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createWebGptTokenizer } from "../src/index";

describe("createWebGptTokenizer", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("loads the vendored GPT-2 tokenizer assets", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (!url.startsWith("file://")) {
        throw new Error(`Unexpected fetch URL in tokenizer test: ${url}`);
      }

      const content = await fs.readFile(new URL(url));

      return new Response(content, {
        status: 200,
      });
    }) as typeof fetch;

    const tokenizer = await createWebGptTokenizer();
    const input = "the quick brown fox";
    const encoded = tokenizer.encode(input);

    expect(tokenizer.getVocabSize()).toBe(50_257);
    expect(encoded.length).toBeGreaterThan(0);
    expect(tokenizer.decode(encoded)).toBe(input);
  });
});
