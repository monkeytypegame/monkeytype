import { createMemo, createRoot } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import * as CustomText from "../../src/ts/test/custom-text";

describe("custom text", () => {
  const originalLimit = CustomText.getLimitValue();

  afterEach(() => {
    CustomText.setLimitValue(originalLimit);
  });

  it("reactively updates the limit value", () => {
    createRoot((dispose) => {
      const limit = createMemo(() => CustomText.getLimitValue());

      expect(limit()).toBe(originalLimit);

      CustomText.setLimitValue(originalLimit + 1);

      expect(limit()).toBe(originalLimit + 1);
      dispose();
    });
  });
});
