import AnimatedModal from "../utils/animated-modal";

export function show(): void {
  void modal.show();
}

const modal = new AnimatedModal({
  dialogId: "contactModal",
});
