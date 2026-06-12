import { UserNameSchema } from "@monkeytype/schemas/users";
import { z } from "zod";

import Ape from "../../../ape";
import {
  getPasswordSchema,
  isUsingPasswordAuthentication,
  reauthenticate,
} from "../../../auth";
import * as DB from "../../../db";
import { isAuthenticated } from "../../../states/core";
import { showSimpleModal } from "../../../states/simple-modal";
import { remoteValidation } from "../../../utils/remote-validation";

export function showUpdateNameModal(): void {
  const snapshot = DB.getSnapshot();
  if (!isAuthenticated() || !snapshot) return;

  showSimpleModal({
    title: "Update name",
    buttonText: isUsingPasswordAuthentication()
      ? "update"
      : "reauthenticate to update",
    text: DB.getSnapshot()?.needsToChangeName
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
        hidden: !isUsingPasswordAuthentication(),
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
      const reauth = await reauthenticate({ password });
      if (reauth.status !== "success") {
        return {
          status: reauth.status,
          message: reauth.message,
        };
      }

      const response = await Ape.users.updateName({
        body: { name: newName },
      });
      if (response.status !== 200) {
        return {
          status: "error",
          message: "Failed to update name",
          notificationOptions: { response },
        };
      }

      snapshot.name = newName;
      DB.setSnapshot(snapshot);
      if (snapshot.needsToChangeName) {
        //TODO needed?
        //reloadAfter(2);
      }

      return {
        status: "success",
        message: "Name updated",
      };
    },
  });
}
