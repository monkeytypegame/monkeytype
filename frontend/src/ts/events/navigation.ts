import { createEvent } from "../hooks/createEvent";
import { LoadingOptions } from "../pages/page";

export type NavigateOptions = {
  force?: boolean;
  empty?: boolean;
  //this will be used in tribe
  data?: unknown;
  loadingOptions?: LoadingOptions;
  tribeOverride?: boolean;
};

export type NavigationEventData = {
  url: string;
  options: NavigateOptions;
};

export const navigationEvent = createEvent<NavigationEventData>();
