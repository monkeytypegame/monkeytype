import { UserCredential } from "firebase/auth";

type SubscribeFunction = (
  signedInUser: UserCredential,
  isNewUser: boolean
) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(
  signedInUser: UserCredential,
  isNewUser: boolean
): void {
  subscribers.forEach((fn) => {
    try {
      fn(signedInUser, isNewUser);
    } catch (e) {
      console.error("Google Sign Up event subscriber threw an error");
      console.error(e);
    }
  });
}
