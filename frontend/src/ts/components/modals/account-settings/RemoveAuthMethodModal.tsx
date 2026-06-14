import { z } from "zod";

import {
  AuthMethod,
  getAuthMethodDisplay,
  getPasswordSchema,
  hasAdditionalAuthMethods,
  isUsingPasswordAuthentication,
  removeAuthProvider,
} from "../../../auth";
import { isAuthenticated } from "../../../states/core";
import { showNoticeNotification } from "../../../states/notifications";
import { showSimpleModal } from "../../../states/simple-modal";

export function showRemoveAuthMethodModal(options: {
  authMethod: AuthMethod;
}): void {
  if (!isAuthenticated()) return;

  //check there is at least one authentication remaining
  const hasRemainingAuth = hasAdditionalAuthMethods(options.authMethod);

  if (!hasRemainingAuth) {
    showNoticeNotification("No remaining authentication enabled");
    return;
  }

  const methodDisplay = getAuthMethodDisplay(options.authMethod);

  showSimpleModal({
    title: `Remove ${methodDisplay} authentication`,
    buttonText:
      options.authMethod !== "password" ? "remove" : "reauthenticate to remove",
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
      const result = await removeAuthProvider(options.authMethod, { password });
      if (result.status !== "success") {
        return result;
      }

      //TODO needed?
      // reloadAfter(3);
      return result;
    },
  });
}
