import { createStore } from "solid-js/store";

type ModalId = "VersionHistory";

const [openModals, setOpenModals] = createStore<
  Partial<Record<ModalId, boolean>>
>({});

export function showModal(id: ModalId): void {
  setOpenModals(id, true);
}

export function hideModal(id: ModalId): void {
  setOpenModals(id, false);
}

export function isModalOpen(id: ModalId): boolean {
  return !!openModals[id];
}
