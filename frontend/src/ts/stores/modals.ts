import { createStore } from "solid-js/store";

export type ModalId =
  | "VersionHistory"
  | "Contact"
  | "Support"
  | "Commandline"
  | "MiniResultChartModal";

export type ModalVisibility = {
  visible: boolean;
  chained: boolean;
};

type ModalState = {
  openModals: Partial<Record<ModalId, ModalVisibility>>;
  modalStack: ModalId[];
  pendingModal: ModalId | null;
  pendingIsChained: boolean;
};

const [modalState, setModalState] = createStore<ModalState>({
  openModals: {},
  modalStack: [],
  pendingModal: null,
  pendingIsChained: false,
});

export function showModal(id: ModalId): void {
  const currentlyOpenModal = getCurrentlyOpenModal();

  if (currentlyOpenModal !== null && currentlyOpenModal !== id) {
    // A different modal is open, chain them
    setModalState((state) => ({
      modalStack: [...state.modalStack, currentlyOpenModal],
      pendingModal: id,
      pendingIsChained: true,
    }));

    // Hide current modal with chained flag - the new modal will show after hide completes
    setModalState("openModals", currentlyOpenModal, {
      visible: false,
      chained: true,
    });
  } else {
    // No modal open, show immediately
    setModalState("openModals", id, { visible: true, chained: false });
  }
}
export function hideModal(id: ModalId): void {
  // Check if there's a pending modal to show (chained show/hide)
  if (modalState.pendingModal !== null) {
    const nextModal = modalState.pendingModal;
    const isChained = modalState.pendingIsChained;

    setModalState({
      pendingModal: null,
      pendingIsChained: false,
    });

    // Don't update the current modal's state - it's already false
    setModalState("openModals", nextModal, {
      visible: true,
      chained: isChained,
    });
    return;
  }

  // Check if this modal was part of a chain (user dismissed, go back)
  const stackCopy = [...modalState.modalStack];
  const previousModal = stackCopy.pop();

  if (previousModal !== undefined) {
    // Queue the previous modal to show after hide animation completes
    setModalState({
      modalStack: stackCopy,
      pendingModal: previousModal,
      pendingIsChained: true,
    });

    // Mark current modal as hiding with chained flag
    setModalState("openModals", id, { visible: false, chained: true });
  } else {
    // No chain, just hide normally
    setModalState("openModals", id, { visible: false, chained: false });
  }
}

export function hideModalAndClearChain(id: ModalId): void {
  // Clear the entire chain
  setModalState({
    modalStack: [],
    pendingModal: null,
    pendingIsChained: false,
  });

  // Just hide the modal normally
  setModalState("openModals", id, { visible: false, chained: false });
}

export function hideCurrentModalAndClearChain(): void {
  const currentlyOpenModal = getCurrentlyOpenModal();
  if (currentlyOpenModal !== null) {
    hideModalAndClearChain(currentlyOpenModal);
  }
}

export function getModalVisibility(id: ModalId): ModalVisibility | null {
  return modalState.openModals[id] ?? null;
}

export function isModalOpen(id: ModalId): boolean {
  return modalState.openModals[id]?.visible === true;
}

export function isModalChained(id: ModalId): boolean {
  return modalState.openModals[id]?.chained === true;
}

function getCurrentlyOpenModal(): ModalId | null {
  for (const [id, visibility] of Object.entries(modalState.openModals)) {
    if (visibility?.visible) {
      return id as ModalId;
    }
  }
  return null;
}
