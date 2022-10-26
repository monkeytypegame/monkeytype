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
  for (const fn of subscribers) {
    try {
      fn(signedInUser, isNewUser);
    } catch (error) {
      console.error("Google Sign Up event subscriber threw an error");
      console.error(error);
    }
  }
}
