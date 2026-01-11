import { createSignal } from "solid-js";
import { PageName } from "../pages/page";

export const [getActivePage, setActivePage] = createSignal<PageName>("loading");
