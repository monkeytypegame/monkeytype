import { createStore } from "solid-js/store";

export type ModalId = "VersionHistory" | "Contact" | "Support";

export type ModalVisibility = {
  visible: boolean;
  chained: boolean;
};

const [openModals, setOpenModals] = createStore<
  Partial<Record<ModalId, ModalVisibility>>
>({});

export function showModal(id: ModalId): void {
  setOpenModals(id, { visible: true, chained: false });
}

export function hideModal(id: ModalId): void {
  setOpenModals(id, { visible: false, chained: false });
}

export function getModalVisibility(id: ModalId): ModalVisibility | null {
  return openModals[id] ?? null;
}

export function isModalOpen(id: ModalId): boolean {
  return openModals[id]?.visible === true;
}
