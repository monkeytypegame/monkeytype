import { LayoutNameSchema } from "@monkeytype/contracts/schemas/layouts";
import { Layout } from "@monkeytype/contracts/schemas/configs";

export const LayoutsList:Layout[] = LayoutNameSchema._def.values;