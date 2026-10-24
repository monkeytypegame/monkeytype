import { render } from "@solidjs/testing-library";

import { Words } from "../../src/ts/components/pages/test/Words";

/** Renders Words, returns its #words element. */
export function renderWords(): HTMLElement {
  return render(() => <Words />).container.firstElementChild as HTMLElement;
}
