import { UserCredential } from "firebase/auth";
import { createEvent } from "../hooks/createEvent";

export type GoogleSignUpEventData = {
  signedInUser: UserCredential;
  isNewUser: boolean;
};

export const googleSignUpEvent = createEvent<GoogleSignUpEventData>();
