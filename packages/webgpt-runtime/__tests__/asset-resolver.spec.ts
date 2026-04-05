import { describe, expect, it } from "vitest";
import {
  DEFAULT_WEBGPT_WEIGHTS_BASE_URL,
  createWebGptAssetUrlResolver,
} from "../src/index";

describe("createWebGptAssetUrlResolver", () => {
  it("uses raw for metadata and media for LFS binaries by default", () => {
    const resolveAssetUrl = createWebGptAssetUrlResolver();

    expect(DEFAULT_WEBGPT_WEIGHTS_BASE_URL).toBe(
      "https://raw.githubusercontent.com/hunterpaulson/webgpt-gpt2-weights/main/",
    );
    expect(resolveAssetUrl("weights/gpt2/params_gpt.json")).toBe(
      "https://raw.githubusercontent.com/hunterpaulson/webgpt-gpt2-weights/main/weights/gpt2/params_gpt.json",
    );
    expect(resolveAssetUrl("weights/gpt2/transformer.ln_f.bias_gpt.bin")).toBe(
      "https://media.githubusercontent.com/media/hunterpaulson/webgpt-gpt2-weights/main/weights/gpt2/transformer.ln_f.bias_gpt.bin",
    );
  });

  it("keeps tokenizer assets local and model weights external", () => {
    const resolveAssetUrl = createWebGptAssetUrlResolver({
      weightsBaseUrl: "https://example.com/webgpt-assets",
    });

    expect(
      new URL(resolveAssetUrl("weights/tokenization/vocab.bpe")).protocol,
    ).toBe("file:");
    expect(
      new URL(resolveAssetUrl("weights/tokenization/gpt_tokens.json")).protocol,
    ).toBe("file:");
    expect(resolveAssetUrl("weights/gpt2/params_gpt.json")).toBe(
      "https://example.com/webgpt-assets/weights/gpt2/params_gpt.json",
    );
  });
});
