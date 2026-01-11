import { createSignal } from "solid-js";
import { PageName } from "../pages/page";

export const [getActivePage, setActivePage] = createSignal<PageName>("loading");
export const [getVersion, setVersion] = createSignal<{
  text: string;
  isNew: boolean;
}>({
  text: "",
  isNew: false,
});
