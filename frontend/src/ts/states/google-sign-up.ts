import type { AuthUser } from "../auth/providers/types";
import { createSignal } from "solid-js";
import { showModal } from "./modals";

/** The new google user picking a name in the google sign up modal. */
const [getGoogleSignUpUser, setGoogleSignUpUser] = createSignal<
  AuthUser | undefined
>(undefined);

export { getGoogleSignUpUser, setGoogleSignUpUser };

export function showGoogleSignUpModal(user: AuthUser): void {
  setGoogleSignUpUser(user);
  showModal("GoogleSignup");
}
