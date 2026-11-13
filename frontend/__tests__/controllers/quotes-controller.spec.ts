import { describe, it, expect, vi } from "vitest";
import { Config as ConfigType } from "@monkeytype/schemas/configs";
import { Config, setConfigStore } from "../../src/ts/config/store";
import quoteController from "../../src/ts/controllers/quotes-controller";

function set<K extends keyof ConfigType>(key: K, value: ConfigType[K]): void {
  Config[key] = value;
  setConfigStore(key, value);
}

describe("quotes controller config effects", () => {
  const updateQuoteQueueMock = vi.spyOn(quoteController, "updateQuoteQueue");

  it("updates the queue on quote length changes", () => {
    set("quoteLength", [0, 1]);
    expect(updateQuoteQueueMock).toHaveBeenLastCalledWith([0, 1]);

    set("quoteLength", [0, 1, 2]);
    expect(updateQuoteQueueMock).toHaveBeenLastCalledWith([0, 1, 2]);
  });
});
