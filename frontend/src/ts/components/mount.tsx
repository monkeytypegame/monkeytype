import { render } from "solid-js/web";
import { qs } from "../utils/dom";
import { ScrollToTop } from "./ScrollToTop";
import { VersionButton } from "../elements/VersionButton";
import { VersionHistoryModal } from "../modals/VersionHistoryModal";

export function mountComponents(): void {
  const body = document.body;
  render(() => <ScrollToTop />, body);
  render(() => <VersionHistoryModal />, body);

  const versionButtonContainer = qs("footer .currentVersion");
  if (versionButtonContainer) {
    render(
      () => <VersionButton />,
      versionButtonContainer.native.parentElement as HTMLElement,
    );
    versionButtonContainer.native.remove();
  }
}
