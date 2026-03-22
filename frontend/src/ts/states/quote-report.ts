import { createSignal } from "solid-js";
import { showModal } from "./modals";

const [quoteId, setQuoteId] = createSignal<number>(0);

export { quoteId };

export function showQuoteReportModal(id: number): void {
  setQuoteId(id);
  showModal("QuoteReport");
}
