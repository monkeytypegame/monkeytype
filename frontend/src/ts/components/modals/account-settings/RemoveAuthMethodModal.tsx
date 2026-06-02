import { unlink } from "firebase/auth";
import { z } from "zod";

import { isAuthenticated } from "../../../states/core";
import { showNoticeNotification } from "../../../states/notifications";
import { showSimpleModal } from "../../../states/simple-modal";
import { createErrorMessage } from "../../../utils/error";
import {
  AuthMethod,
  getPasswordSchema,
  isUsingGithubAuthentication,
  isUsingGoogleAuthentication,
  isUsingPasswordAuthentication,
  reauthenticate,
} from "../../../utils/firebase-auth";
import { reloadAfter } from "../../../utils/misc";

export function showRemoveAuthMethodModal(options: {
  authMethod: AuthMethod;
  callback: () => void;
}): void {
  if (!isAuthenticated()) return;

  //check there is at least one authentication remaining
  const hasRemainingAuth = [
    isUsingPasswordAuthentication() && options.authMethod !== "password",
    isUsingGithubAuthentication() && options.authMethod !== "github.com",
    isUsingGoogleAuthentication() && options.authMethod !== "google.com",
  ].find((it) => it);

  if (!hasRemainingAuth) {
    showNoticeNotification("No remaining authentication enabled");
    return;
  }

  const methodDisplay =
    options.authMethod === "password"
      ? "Password"
      : options.authMethod === "github.com"
        ? "GitHub"
        : "Google";

  showSimpleModal({
    title: `Remove ${methodDisplay} authentication`,
    buttonText: "remove",
    buttonAlwaysEnabled: options.authMethod !== "password",
    schema: z.object({
      password: getPasswordSchema(),
      checked: z.literal(true),
    }),
    inputs: {
      password: {
        placeholder: "Password",
        type: "password",
        hidden:
          !isUsingPasswordAuthentication() || options.authMethod === "password",
      },
      checked: {
        type: "checkbox",
        label: `I understand I will lose access to my Monkeytype account if my Google/GitHub account is lost or disabled.`,
        hidden: options.authMethod !== "password",
      },
    },

    execFn: async ({ password }) => {
      const reauth = await reauthenticate({
        password,
        excludeMethod: options.authMethod,
      });
      if (reauth.status !== "success") {
        return {
          status: reauth.status,
          message: reauth.message,
        };
      }

      try {
        await unlink(reauth.user, options.authMethod);
      } catch (e) {
        const message = createErrorMessage(
          e,
          options.authMethod === "password"
            ? "Failed to remove password authentication"
            : `Failed to unlink ${methodDisplay} account`,
        );
        return {
          status: "error",
          message,
        };
      }

      options.callback();

      reloadAfter(3);
      return {
        status: "success",
        message: `${methodDisplay} authentication removed`,
      };
    },
  });
}
