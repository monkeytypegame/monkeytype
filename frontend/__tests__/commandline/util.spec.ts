//import type { ConfigMetadata } from "../../src/ts/config-metadata";

import * as Util from "../../src/ts/commandline/util";

import type { CommandlineConfigMetadata } from "../../src/ts/commandline/commandline-metadata";
import type { ConfigKey } from "@monkeytype/schemas/configs";
import type { ConfigMetadata } from "../../src/ts/config-metadata";
import { z, ZodSchema } from "zod";

const buildCOmmandWithSubgroup = Util.__testing._buildCommandWithSubgroup;

describe("CommandlineUtils", () => {
  vi.mock("../../src/ts/config-metadata", () => ({ configMetadata: [] }));
  vi.mock("../../src/ts/commandline/commandline-metadata", () => ({
    commandlineConfigMetadata: [],
  }));

  afterAll(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  describe("buildCommandWithSubgroup", () => {
    it("detects values for boolean schema", () => {
      //GIVEN
      const schema = z.boolean();

      //WHEN
      const cmd = buildCommand({ schema });

      //THEN
      expect(cmd.subgroup?.list.map((it) => it.id)).toEqual([
        "setFalse",
        "setTrue",
      ]);
    });

    it("detects values for enum schema", () => {
      //GIVEN
      const schema = z.enum(["one", "two", "three"]);

      //WHEN
      const cmd = buildCommand({ schema });

      //THEN
      expect(cmd.subgroup?.list.map((it) => it.id)).toEqual([
        "setOne",
        "setTwo",
        "setThree",
      ]);
    });

    it("detects values for union schema of enum + literral", () => {
      //GIVEN
      const schema = z.literal("default").or(z.enum(["one", "two", "three"]));

      //WHEN
      const cmd = buildCommand({ schema });

      //THEN
      expect(cmd.subgroup?.list.map((it) => it.id)).toEqual([
        "setDefault",
        "setOne",
        "setTwo",
        "setThree",
      ]);
    });

    it("uses commandValues over schema values", () => {
      //GIVEN
      const schema = z.enum(["one", "two", "three"]);

      //WHEN
      const cmd = buildCommand({
        cmdMeta: { commandValues: ["one", "two"] },
        schema,
      });

      //THEN
      expect(cmd.subgroup?.list.map((it) => it.id)).toEqual([
        "setOne",
        "setTwo",
      ]);
    });

    it("uses commandValues for number schema", () => {
      //GIVEN
      const schema = z.number().int();

      //WHEN
      const cmd = buildCommand({
        cmdMeta: { commandValues: [0.25, 0.75] },
        schema,
      });

      //THEN
      expect(cmd.subgroup?.list.map((it) => it.id)).toEqual([
        "set0.25",
        "set0.75",
      ]);
    });
  });
});

function buildCommand<K extends ConfigKey>({
  configMeta,
  cmdMeta,
  schema,
  key,
}: {
  configMeta?: Partial<ConfigMetadata<K>>;
  cmdMeta?: Partial<CommandlineConfigMetadata<K>>;
  schema?: ZodSchema;
  key?: K;
}) {
  return buildCOmmandWithSubgroup(
    key ?? ("" as any),
    configMeta ?? ({} as any),
    cmdMeta ?? ({} as any),
    schema ?? z.string()
  );
}
