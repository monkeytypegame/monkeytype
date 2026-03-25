import { createEvent } from "../hooks/createEvent";

export const restartTestEvent = createEvent<
  { isQuickRestart?: boolean } | undefined
>();
