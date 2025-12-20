import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/dom";
import { userEvent } from "@testing-library/user-event";
import { qs } from "../../src/ts/utils/dom";

describe("dom", () => {
  describe("ElementWithUtils", () => {
    describe("onChild", () => {
      const handler = vi.fn();

      function registerOnChild(event: string, selector: string): void {
        const parent = qs("#parent");
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
        handler.mockReset();

        document.body.innerHTML = "";
        const root = document.createElement("div");

        root.innerHTML = `
          <div id="parent" data-testid="parent">
            <section id="decoy">
            <div id="mid1" data-testid="mid1" class="middle">
                <div id="inner1" class="inner">test</div>
                <div id="inner2" data-testid="inner2" class="inner">
                  test
                  <button id="button" data-testid="button">click</button>
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

        //This is the same behavior as jQuery `.on` with selector.
        //The handler will be called two times,
        //It does NOT call on the <section> or the parent element itself
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
        handler.mockReset();
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
});
