import { UserProfile } from "@monkeytype/schemas/users";
import { createSignal } from "solid-js";

export const [getUserToReport, setUserToReport] =
  createSignal<UserProfile | null>(null);
