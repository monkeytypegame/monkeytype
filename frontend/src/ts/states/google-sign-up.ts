import { UserCredential } from "firebase/auth";
import { createSignal } from "solid-js";
import { showModal } from "./modals";

/** The new google user picking a name in the google sign up modal. */
const [getGoogleSignUpUser, setGoogleSignUpUser] = createSignal<
  UserCredential | undefined
>(undefined);

export { getGoogleSignUpUser, setGoogleSignUpUser };

export function showGoogleSignUpModal(user: UserCredential): void {
  setGoogleSignUpUser(user);
  showModal("GoogleSignup");
}
