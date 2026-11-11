import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";

import { Balloon } from "../../../src/ts/components/common/Balloon";

describe("Balloon component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a div with the balloon text", () => {
    const { container } = render(() => (
      <Balloon text="hello" position="down">
        content
      </Balloon>
    ));

    const div = container.querySelector("div");
    expect(div).toHaveAttribute("aria-label", "hello");
    expect(div).toHaveAttribute("data-balloon-pos", "down");
    expect(div).toHaveTextContent("content");
  });
});
