import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/dom";
import { userEvent } from "@testing-library/user-event";
import { qs } from "../../src/ts/utils/dom";

describe("dom", () => {
  describe("ElementWithUtils", () => {
    describe("onChild", () => {
      const handler = vi.fn();
      const jqHandler = vi.fn();

      function registerOnChild(event: string, selector: string): void {
        const parent = qs("#parent");
        parent?.onChild(event, selector, (e) =>
          handler({ target: e.target, matchedTarget: e.matchedTarget }),
        );
        $("#parent").on(event, selector, (e) =>
          jqHandler({ target: e.target, currentTarget: e.currentTarget }),
        );
      }

      beforeEach(() => {
        handler.mockReset();
        jqHandler.mockReset();

        document.body.innerHTML = "";
        const root = document.createElement("div");

        root.innerHTML = `
          <div id="parent" data-testid="parent">
            
            <div id="mid1" data-testid="mid1" class="middle">
                <div id="inner1" class="inner">test</div>
                <div id="inner2" data-testid="inner2" class="inner">
                  test
                  <button id="button" data-testid="button">click</div>
                </div>
            </div>
            <div id="mid2" class="middle">
                <div id="inner3" class="inner">test</div>
                <div id="inner4" class="inner">test</div>
            </div>
        </div>
        `;
        document.body.appendChild(root);
      });

      it("should not fire on parent element", () => {
        //GIVEN
        registerOnChild("click", "div");

        //WHEN
        userEvent.click(screen.getByTestId("parent"));

        //THEN
        expect(handler).not.toHaveBeenCalled();
        expect(jqHandler).not.toHaveBeenCalled();
      });

      it("should fire on selector", async () => {
        //GIVEN
        registerOnChild("click", "div");

        //WHEN
        const clickTarget = screen.getByTestId("mid1");
        await userEvent.click(clickTarget);

        //THEN
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            target: clickTarget,
            matchedTarget: clickTarget,
          }),
        );
        expect(jqHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            target: clickTarget,
            currentTarget: clickTarget,
          }),
        );
      });

      it("should fire on selector if child is clicked", async () => {
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
            matchedTarget: selectorTarget,
          }),
        );
        expect(jqHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            target: clickTarget,
            currentTarget: selectorTarget,
          }),
        );
      });

      it("should fire on each selector if child is clicked", async () => {
        //GIVEN
        registerOnChild("click", "div");

        //WHEN
        const firstSelectorTarget = screen.getByTestId("inner2");
        const secondSelectorTarget = screen.getByTestId("mid1");
        const clickTarget = screen.getByTestId("button");
        await userEvent.click(clickTarget);

        //THEN

        expect(jqHandler).toHaveBeenCalledTimes(2);
        expect(jqHandler).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            target: clickTarget,
            currentTarget: firstSelectorTarget,
          }),
        );
        expect(jqHandler).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            target: clickTarget,
            currentTarget: secondSelectorTarget,
          }),
        );

        expect(handler).toHaveBeenCalledTimes(2);
        expect(handler).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            target: clickTarget,
            matchedTarget: firstSelectorTarget,
          }),
        );
        expect(handler).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            target: clickTarget,
            matchedTarget: secondSelectorTarget,
          }),
        );
      });
    });
  });
});
