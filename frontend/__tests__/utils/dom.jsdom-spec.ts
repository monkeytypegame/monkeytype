import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/dom";
import { userEvent } from "@testing-library/user-event";
import {
  ElementWithUtils,
  qsr,
  onDOMReady,
  __testing,
} from "../../src/ts/utils/dom";
const resetReady = __testing.resetReady;

describe("dom", () => {
  describe("ElementWithUtils", () => {
    describe("onChild", () => {
      const handler = vi.fn();

      function registerOnChild(
        event: string,
        selector: string,
        options?: {
          parent?: ElementWithUtils;
        },
      ): void {
        const parent = options?.parent ?? qsr("#parent");
        parent?.onChild(event, selector, (e) =>
          handler({
            target: e.target,
            childTarget: e.childTarget,
            //@ts-expect-error will be added later, check TODO on the ChildEvent
            currentTarget: e.currentTarget,
          }),
        );
      }

      beforeEach(() => {
        handler.mockClear();

        document.body.innerHTML = "";
        const root = document.createElement("div");

        root.innerHTML = `
          <div id="parent" data-testid="parent">
            <section id="decoy">
            <div id="mid1" data-testid="mid1" class="middle">
                <div id="inner1" class="inner">test</div>
                <div id="inner2" data-testid="inner2" class="inner">
                  test
                  <button id="button" data-testid="button">
                    click me 
                    <i id="icon" data-testid="icon">test</i>
                  </button>
                </div>
            </div>
            <div id="mid2" class="middle">
                <div id="inner3" class="inner">test</div>
                <div id="inner4" class="inner">test</div>
            </div>
            </section>
        </div>
        `;
        document.body.appendChild(root);
      });

      it("should not fire when parent element is clicked", async () => {
        //GIVEN
        registerOnChild("click", "div");

        //WHEN
        await userEvent.click(screen.getByTestId("parent"));

        //THEN
        expect(handler).not.toHaveBeenCalled();
      });

      it("should not fire when selector doesnt match", async () => {
        //GIVEN
        const buttonEl = qsr("#button");
        registerOnChild("click", "div", { parent: buttonEl });

        //WHEN
        await userEvent.click(screen.getByTestId("icon"));

        //THEN
        expect(handler).not.toHaveBeenCalled();
      });

      it("should fire when selector is clicked", async () => {
        //GIVEN
        registerOnChild("click", "div");

        //WHEN
        const clickTarget = screen.getByTestId("mid1");
        await userEvent.click(clickTarget);

        //THEN
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            target: clickTarget,
            childTarget: clickTarget,
            currentTarget: screen.getByTestId("parent"),
          }),
        );
      });

      it("should fire when child of selector is clicked", async () => {
        //GIVEN
        registerOnChild("click", "div.middle");

        //WHEN
        const selectorTarget = screen.getByTestId("mid1");
        const clickTarget = screen.getByTestId("button");
        await userEvent.click(clickTarget);

        //THEN
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            target: clickTarget,
            childTarget: selectorTarget,
            currentTarget: screen.getByTestId("parent"),
          }),
        );
      });

      it("should fire on each element matching the selector from the child up to the parent", async () => {
        //GIVEN
        registerOnChild("click", "div.middle, div.inner");

        //WHEN
        let clickTarget = screen.getByTestId("button");
        await userEvent.click(clickTarget);

        //THEN
        expect(handler).toHaveBeenCalledTimes(2);

        //First call is for childTarget inner2 (grand child of parent)
        expect(handler).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            target: clickTarget,
            childTarget: screen.getByTestId("inner2"),
            currentTarget: screen.getByTestId("parent"),
          }),
        );

        //Second call is for childTarget mid1 (child of parent)
        expect(handler).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            target: clickTarget,
            childTarget: screen.getByTestId("mid1"),
            currentTarget: screen.getByTestId("parent"),
          }),
        );

        //WHEN click on mid1 handler is only called one time
        handler.mockClear();
        clickTarget = screen.getByTestId("mid1");
        await userEvent.click(clickTarget);

        //THEN
        expect(handler).toHaveBeenCalledTimes(1);

        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            target: clickTarget,
            childTarget: clickTarget,
            currentTarget: screen.getByTestId("parent"),
          }),
        );
      });
    });
  });
  describe("onDOMReady", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
      resetReady();
      vi.useFakeTimers();
    });

    function dispatchEvent(event: "DOMContextLoaded" | "load"): void {
      if (event === "DOMContextLoaded") {
        document.dispatchEvent(new Event("DOMContentLoaded"));
      } else {
        window.dispatchEvent(new Event("load"));
      }

      vi.runAllTimers();
    }

    it("executes callbacks when DOMContentLoaded fires", () => {
      const spy = vi.fn();
      onDOMReady(spy);
      expect(spy).not.toHaveBeenCalled();

      dispatchEvent("DOMContextLoaded");

      expect(spy).toHaveBeenCalledOnce();
    });

    it("executes callbacks added before ready in order", () => {
      const calls: number[] = [];
      onDOMReady(() => calls.push(1));
      onDOMReady(() => calls.push(2));

      dispatchEvent("DOMContextLoaded");

      expect(calls).toEqual([1, 2]);
    });

    it("executes callbacks asynchronously when DOM is already ready", () => {
      const spy = vi.fn();

      Object.defineProperty(document, "readyState", {
        value: "complete",
        configurable: true,
      });

      onDOMReady(spy);

      expect(spy).not.toHaveBeenCalled();

      vi.runAllTimers();

      expect(spy).toHaveBeenCalledOnce();
    });

    it("executes callbacks added after ready asynchronously", () => {
      const calls: string[] = [];
      onDOMReady(() => calls.push("ready"));

      dispatchEvent("DOMContextLoaded");

      onDOMReady(() => calls.push("late"));

      expect(calls).toEqual(["ready"]);

      vi.runAllTimers();

      expect(calls).toEqual(["ready", "late"]);
    });

    it("executes callbacks added during ready execution", () => {
      const calls: number[] = [];

      onDOMReady(() => {
        calls.push(1);
        onDOMReady(() => calls.push(3));
      });

      onDOMReady(() => calls.push(2));

      dispatchEvent("DOMContextLoaded");

      expect(calls).toEqual([1, 2, 3]);
    });

    it("does not execute ready callbacks more than once", () => {
      const spy = vi.fn();

      onDOMReady(spy);

      dispatchEvent("DOMContextLoaded");
      dispatchEvent("load");

      expect(spy).toHaveBeenCalledOnce();
    });

    it("falls back to window load event if DOMContentLoaded does not fire", () => {
      const spy = vi.fn();

      onDOMReady(spy);

      dispatchEvent("load");

      expect(spy).toHaveBeenCalledOnce();
    });
  });
});
