import { describe, it, expect } from "vitest";
import { render } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";
import { SolidTest } from "../../src/ts/components/SolidTest";

describe("SolidTest", () => {
  function renderElement(): {
    span: HTMLSpanElement;
    button: HTMLButtonElement;
  } {
    const { container } = render(() => <SolidTest />);

    return {
      // oxlint-disable-next-line no-non-null-assertion
      span: container.querySelector("span")!,
      // oxlint-disable-next-line no-non-null-assertion
      button: container.querySelector("button")!,
    };
  }

  it("renders the counter", () => {
    //GIVEN

    //WHEN
    const { span, button } = renderElement();

    //THEN
    expect(span).toHaveTextContent("Test counter");
    expect(button).toBeVisible();
    expect(button).toHaveTextContent("1");
  });

  it("renders the counter and increments on click", async () => {
    //GIVEN
    const { button } = renderElement();

    //WHEN
    await userEvent.click(button);

    //THEN
    expect(button).toHaveTextContent("2");
  });
});
