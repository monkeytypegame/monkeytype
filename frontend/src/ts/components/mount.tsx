import { render } from "solid-js/web";
import { isDevEnvironment } from "../utils/misc";
import { SolidTest } from "../components/SolidTest";
import { qsr } from "../utils/dom";
import { ScrollToTop } from "./ScrollToTop";

export function mountComponents(): void {
  if (isDevEnvironment()) {
    render(() => <SolidTest />, qsr("#solidTest").native);
  }
  render(ScrollToTop, qsr("body").native);
}
