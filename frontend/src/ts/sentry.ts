import * as Sentry from "@sentry/browser";
import { envConfig } from "./constants/env-config";

let debug = false;

let activated = false;

export function activateSentry(): void {
  if (activated) {
    console.warn("Sentry already activated");
    return;
  }
  activated = true;
  console.log("Activating Sentry");
  Sentry.init({
    release: envConfig.clientVersion,
    dsn: "https://f50c25dc9dd75304a63776063896a39b@o4509236448133120.ingest.us.sentry.io/4509237217394688",
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    environment: envConfig.isDevelopment ? "development" : "production",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        unmask: ["#notificationCenter"],
        block: ["#commandLine .modal .suggestions"],
      }),
      Sentry.thirdPartyErrorFilterIntegration({
        filterKeys: ["monkeytype-frontend"],
        // Defines how to handle errors that contain third party stack frames.
        // Possible values are:
        // - 'drop-error-if-contains-third-party-frames'
        // - 'drop-error-if-exclusively-contains-third-party-frames'
        // - 'apply-tag-if-contains-third-party-frames'
        // - 'apply-tag-if-exclusively-contains-third-party-frames'
        behaviour: "drop-error-if-contains-third-party-frames",
      }),
    ],
    // Tracing
    tracesSampleRate: 0.25, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/api\.monkeytype\.com/],
    // Session Replay
    replaysSessionSampleRate: 0, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 0.5, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    ignoreErrors: [
      /**
       * Thrown when firefox prevents an add-on from refrencing a DOM element that has been removed.
       * This can also be filtered by enabling the browser extension inbound filter
       */
      "TypeError: can't access dead object",
      /**
       * React internal error thrown when something outside react modifies the DOM
       * This is usually because of a browser extension or Chrome's built-in translate
       */
      "NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
      "NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
      "Error: There is no clipping info for given tab",
      "Non-Error promise rejection captured",
      "Object captured as promise rejection",
    ],
    beforeSend(event) {
      if (envConfig.isDevelopment) {
        console.debug(
          "Sentry beforeSend, not sending in development mode",
          event
        );
        return null;
      } else {
        if (debug) {
          console.debug("Sentry beforeSend", event);
        }
      }

      return event;

      //   console.log(
      //     "BEFORE SEND FRAMES",
      //     event.exception?.values?.[0]?.stacktrace?.frames
      //   );
      //   if (
      //     event.exception !== undefined &&
      //     event.exception.values !== undefined &&
      //     event.exception.values.length > 0
      //   ) {
      //     const exception = event.exception.values[0];
      //     if (exception && exception.stacktrace) {
      //       console.log(exception);
      //       const frames = exception.stacktrace.frames;
      //       for (const frame of frames ?? []) {
      //         if (frame.filename && frame.filename.includes("monkeytype")) {
      //           // return event;
      //         }
      //       }
      //     }
      //   }
      //   return null;
    },
    beforeBreadcrumb(breadcrumb, _hint) {
      if (breadcrumb.category === "console" && breadcrumb.level === "debug") {
        return null;
      }
      return breadcrumb;
    },
  });
}

export function setUser(uid: string, name: string): void {
  Sentry.setUser({
    id: uid,
    username: name,
  });
}

export function clearUser(): void {
  Sentry.setUser(null);
}

export function captureException(error: Error): void {
  Sentry.captureException(error);
}

export function toggleDebug(): void {
  debug = !debug;
  console.debug("Sentry debug mode:", debug);
}
