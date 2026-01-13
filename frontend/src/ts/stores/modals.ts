import { createStore } from "solid-js/store";

export type ModalId = "VersionHistory" | "Contact" | "Support" | "Commandline";

export type ModalVisibility = {
  visible: boolean;
  chained: boolean;
};

const [openModals, setOpenModals] = createStore<
  Partial<Record<ModalId, ModalVisibility>>
>({});

// Stack to track modal chain - most recent is at the end
let modalStack: ModalId[] = [];

// Queue for the next modal to show after current one hides
let pendingModal: ModalId | null = null;
let pendingIsChained = false;

export function showModal(id: ModalId): void {
  const currentlyOpenModal = getCurrentlyOpenModal();

  if (currentlyOpenModal !== null && currentlyOpenModal !== id) {
    // A different modal is open, chain them
    modalStack.push(currentlyOpenModal);
    pendingModal = id;
    pendingIsChained = true;

    // Hide current modal with chained flag - the new modal will show after hide completes
    setOpenModals(currentlyOpenModal, { visible: false, chained: true });
  } else {
    // No modal open, show immediately
    setOpenModals(id, { visible: true, chained: false });
  }
}
export function hideModal(id: ModalId): void {
  // Check if there's a pending modal to show (chained show/hide)
  if (pendingModal !== null) {
    const nextModal = pendingModal;
    const isChained = pendingIsChained;
    pendingModal = null;
    pendingIsChained = false;
    // Don't update the current modal's state - it's already false
    setOpenModals(nextModal, { visible: true, chained: isChained });
    return;
  }

  // Check if this modal was part of a chain (user dismissed, go back)
  const previousModal = modalStack.pop();

  if (previousModal !== undefined) {
    // Queue the previous modal to show after hide animation completes
    pendingModal = previousModal;
    pendingIsChained = true;
    // Mark current modal as hiding with chained flag
    setOpenModals(id, { visible: false, chained: true });
  } else {
    // No chain, just hide normally
    setOpenModals(id, { visible: false, chained: false });
  }
}

export function hideModalAndClearChain(id: ModalId): void {
  // Clear the entire chain
  modalStack = [];
  pendingModal = null;
  pendingIsChained = false;

  // Just hide the modal normally
  setOpenModals(id, { visible: false, chained: false });
}

export function hideCurrentModalAndClearChain(): void {
  const currentlyOpenModal = getCurrentlyOpenModal();
  if (currentlyOpenModal !== null) {
    hideModalAndClearChain(currentlyOpenModal);
  }
}

export function getModalVisibility(id: ModalId): ModalVisibility | null {
  return openModals[id] ?? null;
}

export function isModalOpen(id: ModalId): boolean {
  return openModals[id]?.visible === true;
}

export function isModalChained(id: ModalId): boolean {
  return openModals[id]?.chained === true;
}

function getCurrentlyOpenModal(): ModalId | null {
  for (const [id, visibility] of Object.entries(openModals)) {
    if (visibility?.visible) {
      return id as ModalId;
    }
  }
  return null;
}
