import { UserNameSchema } from "@monkeytype/schemas/users";
import { z } from "zod";

import Ape from "../../../ape";
import { pickReauthMethod, reauthenticate } from "../../../auth/actions";
import { isAuthenticated } from "../../../auth/state";
import { updateName, getUserData } from "../../../queries/user";
import { showSimpleModal } from "../../../states/simple-modal";
import { remoteValidation } from "../../../utils/remote-validation";
import { getPasswordSchema } from "../../ui/form/utils";

export function showUpdateNameModal(): void {
  const userData = getUserData();
  if (!isAuthenticated() || !userData) return;
  const reauthMethod = pickReauthMethod();
  if (reauthMethod === undefined) return;
  const withPassword = reauthMethod === "password";

  showSimpleModal({
    title: "Update name",
    buttonText: withPassword ? "update" : "reauthenticate to update",
    text: userData.needsToChangeName
      ? "You need to change your account name. This might be because you have a duplicate name, no account name or your name is not allowed (contains whitespace or invalid characters). Sorry for the inconvenience."
      : undefined,
    schema: z.object({
      password: getPasswordSchema(),
      newName: UserNameSchema,
    }),
    inputs: {
      password: {
        placeholder: "password",
        type: "password",
        hidden: !withPassword,
      },
      newName: {
        placeholder: "new name",
        type: "text",
        validation: {
          isValid: remoteValidation(
            async (name: string) =>
              Ape.users.getNameAvailability({ params: { name } }),
            { check: (data) => data.available || "Name not available" },
          ),
          debounceDelay: 1000,
        },
      },
    },

    execFn: async ({ password, newName }) => {
      const reauth = await reauthenticate(
        withPassword
          ? { method: "password", password }
          : { method: reauthMethod },
      );
      if (reauth.status !== "success") {
        // reauthenticate already told the user
        return { status: reauth.status, showNotification: false };
      }

      const { error } = await updateName(newName);
      if (error !== null) {
        return {
          status: "error",
          message: "Failed to update name",
          notificationOptions: { error },
        };
      }

      return {
        status: "success",
        message: "Name updated",
      };
    },
  });
}
