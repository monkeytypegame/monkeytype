import { LayoutNameSchema } from "@monkeytype/contracts/lists/layouts";
import { Layout } from "@monkeytype/contracts/schemas/configs";

export const LayoutsList:Layout[] = LayoutNameSchema._def.values;