import { render } from "@solidjs/testing-library";

import { Words } from "../../src/ts/components/pages/test/Words";

/** Renders Words in its wrapper, returns its #words element. */
export function renderWords(): HTMLElement {
  let wordsWrapper: HTMLDivElement | undefined;
  const { container } = render(() => (
    <div ref={(el) => (wordsWrapper = el)}>
      <Words wordsWrapperRef={() => wordsWrapper} />
    </div>
  ));
  return container.querySelector("#words") as HTMLElement;
}
