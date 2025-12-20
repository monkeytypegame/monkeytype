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

      it("should not fire when parent element is clicked", () => {
        //GIVEN
        registerOnChild("click", "div");

        //WHEN
        userEvent.click(screen.getByTestId("parent"));

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

      it("should fire when any child of the selector is clicked", async () => {
        //GIVEN
        registerOnChild("click", "div");

        //WHEN
        const grandChildTarget = screen.getByTestId("inner2");
        const childTarget = screen.getByTestId("mid1");
        const clickTarget = screen.getByTestId("button");
        await userEvent.click(clickTarget);

        //THEN
        expect(handler).toHaveBeenCalledTimes(2);
        expect(handler).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            target: clickTarget,
            childTarget: grandChildTarget,
            currentTarget: screen.getByTestId("parent"),
          }),
        );
        expect(handler).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            target: clickTarget,
            childTarget: childTarget,
            currentTarget: screen.getByTestId("parent"),
          }),
        );
      });
    });
  });
});
