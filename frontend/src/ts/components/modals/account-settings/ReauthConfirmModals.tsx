import { z } from "zod";

import Ape from "../../../ape";
import { resetConfig } from "../../../config/lifecycle";
import { getSnapshot } from "../../../db";
import { isAuthenticated } from "../../../states/core";
import { showNoticeNotification } from "../../../states/notifications";
import { ExecReturn, showSimpleModal } from "../../../states/simple-modal";
import FileStorage from "../../../utils/file-storage";
import {
  getPasswordSchema,
  isUsingPasswordAuthentication,
  reauthenticate,
} from "../../../utils/firebase-auth";
import { reloadAfter } from "../../../utils/misc";

export function showDeleteAccountModal(): void {
  showReauthConfirmModal({
    title: "Delete account",
    buttonText: "delete",
    confirmText: `I understand I will lose access to my Monkeytype account and all my data will be deleted and cannot be recovered.`,
    action: async () => {
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

export function showOptOutOfLeaderboardsModal(): void {
  showReauthConfirmModal({
    title: "Opt out of leaderboards",
    buttonText: "opt out",
    confirmText: `I understand my account will be removed from all leaderboards and this cannot be undone.`,

    action: async () => {
      const response = await Ape.users.optOutOfLeaderboards();
      if (response.status !== 200) {
        return {
          status: "error",
          message: "Failed to opt out",
          notificationOptions: { response },
        };
      }

      reloadAfter(3);

      return {
        status: "success",
        message: "Leaderboards opt out successful",
      };
    },
  });
}

export function showResetAccountModal(): void {
  showReauthConfirmModal({
    title: "Reset account",
    buttonText: "reset",
    confirmText: `I understand all my data will be deleted and cannot be recovered.`,
    action: async () => {
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

export function showResetPersonalBestsModal(): void {
  showReauthConfirmModal({
    title: "Reset personal bests",
    buttonText: "reset",
    confirmText: `I understand all my personal bests will be deleted and this cannot be undone`,
    action: async () => {
      const response = await Ape.users.deletePersonalBests();
      if (response.status !== 200) {
        return {
          status: "error",
          message: "Failed to reset personal bests",
          notificationOptions: { response },
        };
      }

      const snapshot = getSnapshot();
      if (!snapshot) {
        return {
          status: "error",
          message: "Failed to reset personal bests: no snapshot",
        };
      }

      snapshot.personalBests = {
        time: {},
        words: {},
        quote: {},
        zen: {},
        custom: {},
      };

      return {
        status: "success",
        message: "Personal bests reset",
      };
    },
  });
}

export function showRevokeAllTokensModal() {
  showReauthConfirmModal({
    title: "Revoke all tokens",
    confirmText: `I understand that all my tokens will get revoked and I will be logged out of all devices.`,
    buttonText: "revoke all",
    action: async () => {
      const response = await Ape.users.revokeAllTokens();
      if (response.status !== 200) {
        return {
          status: "error",
          message: "Failed to revoke tokens",
          notificationOptions: { response },
        };
      }

      reloadAfter(3);

      return {
        status: "success",
        message: "Tokens revoked",
      };
    },
  });
}

function showReauthConfirmModal(options: {
  title: string;
  buttonText: string;
  confirmText: string;
  action: () => Promise<ExecReturn>;
}): void {
  if (!isAuthenticated()) return;

  showSimpleModal({
    title: options.title,
    buttonText: isUsingPasswordAuthentication()
      ? options.buttonText
      : `reauthenticate to ${options.buttonText}`,
    schema: z.object({
      password: getPasswordSchema(),
      confirm: z.literal(true),
    }),
    inputs: {
      password: {
        placeholder: "password",
        type: "password",
        hidden: !isUsingPasswordAuthentication(),
      },
      confirm: {
        type: "checkbox",
        label: options.confirmText,
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

      return options.action();
    },
  });
}
