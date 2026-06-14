import { createEvent } from "../hooks/createEvent";

export const connectionEvent = createEvent<boolean>();

window.addEventListener("load", () => {
  window.addEventListener("online", () => {
    connectionEvent.dispatch(true);
  });
  window.addEventListener("offline", () => {
    connectionEvent.dispatch(false);
  });
});
