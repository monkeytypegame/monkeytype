import { z } from "zod";

import { removeAuthMethod } from "../../../auth/actions";
import {
  getAuthMethodDisplay,
  getThirdParties,
  hasOtherAuthMethods,
  isAuthenticated,
  isUsingPasswordAuth,
} from "../../../auth/state";
import { showNoticeNotification } from "../../../states/notifications";
import { showSimpleModal } from "../../../states/simple-modal";
import { getPasswordSchema } from "../../ui/form/utils";

export function showRemoveAuthMethodModal(options: {
  /** a third party id, or `"password"` */
  authMethod: string;
}): void {
  if (!isAuthenticated()) return;

  //check there is at least one authentication remaining
  const hasRemainingAuth = hasOtherAuthMethods(options.authMethod);

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
        hidden: !isUsingPasswordAuth() || options.authMethod === "password",
      },
      checked: {
        type: "checkbox",
        label: `I understand I will lose access to my Monkeytype account if my ${getThirdParties()
          .map((it) => it.display)
          .join("/")} account is lost or disabled.`,
        hidden: options.authMethod !== "password",
      },
    },

    execFn: async ({ password }) => {
      const result = await removeAuthMethod(options.authMethod, { password });
      return result;
    },
  });
}
