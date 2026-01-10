import { render } from "solid-js/web";
import { qsr } from "../utils/dom";
import { ScrollToTop } from "./ScrollToTop";

export function mountComponents(): void {
  render(() => <ScrollToTop />, qsr("body").native);
}
