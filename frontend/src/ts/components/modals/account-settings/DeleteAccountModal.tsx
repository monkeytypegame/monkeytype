import { z } from "zod";

import Ape from "../../../ape";
import { isAuthenticated } from "../../../states/core";
import { showNoticeNotification } from "../../../states/notifications";
import { showSimpleModal } from "../../../states/simple-modal";
import {
  getPasswordSchema,
  isUsingPasswordAuthentication,
  reauthenticate,
} from "../../../utils/firebase-auth";
import { reloadAfter } from "../../../utils/misc";

export function showDeleteAccountModal(): void {
  if (!isAuthenticated()) return;

  showSimpleModal({
    title: "Delete account",
    buttonText: isUsingPasswordAuthentication()
      ? "delete"
      : "reauthenticate to delete",
    schema: z.object({
      password: getPasswordSchema(),
      checked: z.literal(true),
    }),
    inputs: {
      password: {
        placeholder: "password",
        type: "password",
        hidden: !isUsingPasswordAuthentication(),
      },
      checked: {
        type: "checkbox",
        label: `I understand I will lose access to my Monkeytype account and all my data will be deleted and cannot be recovered.`,
      },
    },

    execFn: async ({ password }) => {
      const reauth = await reauthenticate({ password });
      if (reauth.status !== "success") {
        return {
          status: reauth.status,
          message: reauth.message,
        };
      }

      showNoticeNotification("Deleting all data...");
      const response = await Ape.users.delete();

      if (response.status !== 200) {
        return {
          status: "error",
          message: "Failed to delete user data",
          notificationOptions: { response },
        };
      }

      reloadAfter(3);

      return {
        status: "success",
        message: "Account deleted, goodbye",
      };
    },
  });
}
