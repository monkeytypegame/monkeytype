import { z } from "zod";

import Ape from "../../../ape";
import {
  getPasswordSchema,
  isUsingPasswordAuthentication,
  reauthenticate,
  signOut,
} from "../../../auth";
import { isAuthenticated } from "../../../states/core";
import { showNoticeNotification } from "../../../states/notifications";
import { showSimpleModal } from "../../../states/simple-modal";

export function showUpdatePasswordModal(): void {
  if (!isAuthenticated()) return;
  if (!isUsingPasswordAuthentication()) {
    showNoticeNotification("Password authentication is not enabled");
    return;
  }
  showSimpleModal({
    title: "Update password",
    schema: z.object({
      previousPass: z.string().min(1, "Current password is required"),
      newPassword: getPasswordSchema(),
      newPassConfirm: getPasswordSchema(),
    }),
    inputs: {
      previousPass: {
        placeholder: "current password",
        type: "password",
      },
      newPassword: {
        placeholder: "new password",
        type: "password",
      },
      newPassConfirm: {
        placeholder: "confirm new password",
        type: "password",
      },
    },
    buttonText: "update",
    execFn: async ({ previousPass, newPassword, newPassConfirm }) => {
      if (newPassword !== newPassConfirm) {
        return {
          status: "notice",
          message: "New passwords don't match",
        };
      }

      if (newPassword === previousPass) {
        return {
          status: "notice",
          message: "New password must be different from previous password",
        };
      }

      const reauth = await reauthenticate({ password: previousPass });
      if (reauth.status !== "success") {
        return {
          status: reauth.status,
          message: reauth.message,
        };
      }

      const response = await Ape.users.updatePassword({
        body: { newPassword },
      });

      if (response.status !== 200) {
        return {
          status: "error",
          message: "Failed to update password",
          notificationOptions: { response },
        };
      }

      signOut();

      return {
        status: "success",
        message: "Password updated",
      };
    },
  });
}
