import { createEvent } from "../hooks/createEvent";

export type TimerEventData = {
  key: string;
  value?: string;
  value2?: string;
};

export const timerEvent = createEvent<TimerEventData>();
