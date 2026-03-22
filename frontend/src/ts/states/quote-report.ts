import { createSignal } from "solid-js";
import { isCaptchaAvailable } from "../controllers/captcha-controller";
import { showModal } from "./modals";
import { showErrorNotification } from "./notifications";

const [quoteId, setQuoteId] = createSignal<number>(0);

export { quoteId };

export function showQuoteReportModal(id: number): void {
  if (!isCaptchaAvailable()) {
    showErrorNotification(
      "Captcha is not available. Please refresh the page or contact support if this issue persists.",
    );
    return;
  }
  setQuoteId(id);
  showModal("QuoteReport");
}
