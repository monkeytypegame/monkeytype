import { createEffect, createRoot, createSignal } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const { replaceSearch } = vi.hoisted(() => ({ replaceSearch: vi.fn() }));
vi.mock("../../src/ts/router/navigate", () => ({ replaceSearch }));

import { createSearchParams } from "../../src/ts/router/search-params";
import { dispatchPageTransition, PageName } from "../../src/ts/states/router";

const schema = z
  .object({ tab: z.enum(["a", "b"]), page: z.number() })
  .partial();

function setRoutePage(page: PageName): void {
  dispatchPageTransition({ type: "routeResolved", page });
}

describe("createSearchParams", () => {
  const read = vi.fn();
  const params = createSearchParams("settings", schema, read);

  beforeEach(() => {
    read.mockClear();
    replaceSearch.mockClear();
    setRoutePage("settings");
  });

  describe("readOnEnter", () => {
    it("parses the params when entering the route", () => {
      params.readOnEnter({ search: { tab: "b", page: "3" }, cause: "enter" });
      expect(read).toHaveBeenCalledWith({ tab: "b", page: 3 });
    });

    it("passes undefined for invalid params", () => {
      params.readOnEnter({ search: { tab: "nope" }, cause: "enter" });
      expect(read).toHaveBeenCalledWith(undefined);
    });

    it("ignores url changes while staying on the route", () => {
      params.readOnEnter({ search: { tab: "b" }, cause: "stay" });
      expect(read).not.toHaveBeenCalled();
    });
  });

  describe("write", () => {
    it("serializes the data into the url", () => {
      params.write({ tab: "a", page: 2 });
      expect(replaceSearch).toHaveBeenCalledOnce();
      const search = replaceSearch.mock.calls[0]?.[0] as URLSearchParams;
      expect(Object.fromEntries(search)).toEqual({ tab: "a", page: "2" });
    });

    it("does nothing when another page is the route", () => {
      setRoutePage("about");
      params.write({ tab: "a" });
      expect(replaceSearch).not.toHaveBeenCalled();
    });

    it("doesn't make a calling effect depend on router state", () => {
      let runs = 0;
      const [getTab] = createSignal<"a" | "b">("a");
      const dispose = createRoot((dispose) => {
        createEffect(() => {
          runs++;
          params.write({ tab: getTab() });
        });
        return dispose;
      });
      expect(runs).toBe(1);

      // a write navigates, which changes router state - rerunning the effect
      // would write again, looping forever
      setRoutePage("about");
      setRoutePage("settings");
      expect(runs).toBe(1);
      dispose();
    });

    it("reruns a calling effect when its own data changes", () => {
      const [getTab, setTab] = createSignal<"a" | "b">("a");
      const dispose = createRoot((dispose) => {
        createEffect(() => params.write({ tab: getTab() }));
        return dispose;
      });
      setTab("b");
      expect(replaceSearch).toHaveBeenCalledTimes(2);
      dispose();
    });
  });
});
