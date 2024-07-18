import AnimatedModal from "../utils/animated-modal.js";

export function show(): void {
  void modal.show();
}

const modal = new AnimatedModal({
  dialogId: "contactModal",
});
