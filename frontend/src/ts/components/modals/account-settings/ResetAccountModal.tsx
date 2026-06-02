import { z } from "zod";

import Ape from "../../../ape";
import { resetConfig } from "../../../config/lifecycle";
import { isAuthenticated } from "../../../states/core";
import { showNoticeNotification } from "../../../states/notifications";
import { showSimpleModal } from "../../../states/simple-modal";
import FileStorage from "../../../utils/file-storage";
import {
  getPasswordSchema,
  isUsingPasswordAuthentication,
  reauthenticate,
} from "../../../utils/firebase-auth";
import { reloadAfter } from "../../../utils/misc";

export function showResetAccountModal(): void {
  if (!isAuthenticated()) return;

  showSimpleModal({
    title: "Reset account",
    buttonText: isUsingPasswordAuthentication()
      ? "reset"
      : "reauthenticate to reset",
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
        label: `I understand all my data will be deleted and cannot be recovered.`,
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

      showNoticeNotification("Resetting settings...");
      await resetConfig();
      await FileStorage.deleteFile("LocalBackgroundFile");
      await FileStorage.deleteFile("LocalFontFamilyFile");

      showNoticeNotification("Resetting account...");
      const response = await Ape.users.reset();
      if (response.status !== 200) {
        return {
          status: "error",
          message: "Failed to reset account",
          notificationOptions: { response },
        };
      }

      reloadAfter(3);

      return {
        status: "success",
        message: "Account reset",
      };
    },
  });
}
