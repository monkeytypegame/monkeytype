import { signOut } from "../auth";
import { qs } from "../utils/dom";

qs("nav .accountButtonAndMenu .menu button.signOut")?.on("click", () => {
  signOut();
});
