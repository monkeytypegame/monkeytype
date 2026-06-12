import { ApeKeyNameSchema } from "@monkeytype/schemas/ape-keys";
import { z } from "zod";

import Ape from "../../../ape";
import { setLastGeneratedApeKey } from "../../../states/account-settings";
import { showModal } from "../../../states/modals";
import { showSimpleModal } from "../../../states/simple-modal";
import { Button } from "../../common/Button";
import { Section } from "./utils";

export function ApeKeysTab() {
  return (
    <>
      <Section
        title="ape keys"
        fa={{ icon: "fa-key" }}
        text=<>
          Generate Ape Keys to access certain API endpoints (
          <Button
            text="documentation"
            href="https://api.monkeytype.com/docs"
            variant="text"
          />
          ).
        </>
        button={{
          text: "generate new key",
          onClick: () => {
            showSimpleModal({
              title: "Generate new Ape key",
              buttonText: "generate",
              schema: z.object({ name: ApeKeyNameSchema }),
              inputs: {
                name: {
                  type: "text",
                  placeholder: "Name",
                },
              },

              execFn: async ({ name }) => {
                const response = await Ape.apeKeys.add({
                  body: { name, enabled: false },
                });
                if (response.status !== 200) {
                  return {
                    status: "error",
                    message: "Failed to generate key",
                    notificationOptions: { response },
                  };
                }

                const data = response.body.data;

                return {
                  status: "success",
                  message: "Key generated",
                  afterHide: (): void => {
                    setLastGeneratedApeKey(data.apeKey);
                    showModal("ViewApeKey");
                  },
                };
              },
            });
          },
        }}
      />
      ... table...
    </>
  );
}
