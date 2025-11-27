//import type { ConfigMetadata } from "../../src/ts/config-metadata";

import { describe, it, expect, afterAll, vi } from "vitest";
import * as Util from "../../src/ts/commandline/util";

import type { CommandlineConfigMetadata } from "../../src/ts/commandline/commandline-metadata";
import type { ConfigKey } from "@monkeytype/schemas/configs";
import type { ConfigMetadata } from "../../src/ts/config-metadata";
import { z, ZodSchema } from "zod";

const buildCommandForConfigKey = Util.__testing._buildCommandForConfigKey;

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
    describe("type subgroup", () => {
      it("detects options for boolean schema", () => {
        //GIVEN
        const schema = z.boolean();

        //WHEN
        const cmd = buildCommand({
          cmdMeta: { subgroup: { options: "fromSchema" } },
          schema,
        });

        //THEN
        expect(cmd.subgroup?.list.map((it) => it.id)).toEqual([
          "setFalse",
          "setTrue",
        ]);
      });

      it("detects options for enum schema", () => {
        //GIVEN
        const schema = z.enum(["one", "two", "three"]);

        //WHEN
        const cmd = buildCommand({
          cmdMeta: { subgroup: { options: "fromSchema" } },
          schema,
        });

        //THEN
        expect(cmd.subgroup?.list.map((it) => it.id)).toEqual([
          "setOne",
          "setTwo",
          "setThree",
        ]);
      });

      it("detects options for union schema of enum + literral", () => {
        //GIVEN
        const schema = z.literal("default").or(z.enum(["one", "two", "three"]));

        //WHEN
        const cmd = buildCommand({
          cmdMeta: { subgroup: { options: "fromSchema" } },
          schema,
        });

        //THEN
        expect(cmd.subgroup?.list.map((it) => it.id)).toEqual([
          "setDefault",
          "setOne",
          "setTwo",
          "setThree",
        ]);
      });

      it("uses preset options over schema values", () => {
        //GIVEN
        const schema = z.enum(["one", "two", "three"]);

        //WHEN
        const cmd = buildCommand({
          cmdMeta: { subgroup: { options: ["one", "two"] } },
          schema,
        });

        //THEN
        expect(cmd.subgroup?.list.map((it) => it.id)).toEqual([
          "setOne",
          "setTwo",
        ]);
      });

      it("uses preset option  for number schema", () => {
        //GIVEN
        const schema = z.number().int();

        //WHEN
        const cmd = buildCommand({
          cmdMeta: { subgroup: { options: [0.25, 0.75] } },
          schema,
        });

        //THEN
        expect(cmd.subgroup?.list.map((it) => it.id)).toEqual([
          "set0.25",
          "set0.75",
        ]);
      });

      it("sets available", () => {
        //GIVEN
        const schema = z.boolean();
        const isAvailable = (val: any) => (val ? () => true : undefined);

        //WHEN
        const cmd = buildCommand({
          cmdMeta: {
            subgroup: {
              options: "fromSchema",
              isAvailable,
            },
          },
          schema,
        });

        //THEN
        expect(cmd.subgroup?.list[0]?.available).toBeUndefined();
        expect(cmd.subgroup?.list[1]?.available?.()).toBe(true);
      });
    });

    describe("type subgroupWithInput", () => {
      it("uses commandValues for number schema", () => {
        //GIVEN
        const afterExec = () => "test";
        const schema = z.number().int();

        //WHEN
        const cmd = buildCommand({
          key: "test" as any,
          cmdMeta: {
            subgroup: {
              options: [0.25, 0.75],
            },
            input: {
              display: "custom test...",
              inputValueConvert: Number,
              afterExec,
              alias: "alias",
            },
          },
          configMeta: {
            icon: "icon",
          },
          schema,
        });

        const inputCmd = cmd.subgroup?.list.at(cmd.subgroup?.list.length - 1);

        //THEN
        expect(cmd.subgroup?.list.map((it) => it.id)).toEqual([
          "setTest0.25",
          "setTest0.75",
          "setTestCustom",
        ]);

        expect(inputCmd).toEqual({
          id: "setTestCustom",
          display: "custom test...",
          defaultValue: expect.anything(),
          alias: "alias",
          input: true,
          icon: "icon",
          exec: expect.anything(),
          inputValueConvert: Number,
          validation: expect.anything(),
        });
      });
    });
  });

  describe("type input", () => {
    it("has basic properties", () => {
      //GIVEN
      const afterExec = () => "test";
      const schema = z.string();
      //WHEN
      const cmd = buildCommand({
        key: "test" as any,
        cmdMeta: {
          input: {
            display: "custom test...",
            afterExec,
            alias: "alias",
          },
        },
        configMeta: {
          icon: "icon",
        },
        schema,
      });

      //THEN
      expect(cmd).toEqual(
        expect.objectContaining({
          id: "setTestCustom",
          display: "custom test...",
          alias: "alias",
          input: true,
          icon: "icon",
        }),
      );
    });

    it("uses displayString from config for display ", () => {
      //GIVEN

      //WHEN
      const cmd = buildCommand({
        cmdMeta: { input: {} },
        configMeta: { displayString: "My Setting" },
      });

      //THEN
      expect(cmd.display).toEqual("My Setting...");
    });

    it("uses display string from command meta if provided", () => {
      //GIVEN

      //WHEN
      const cmd = buildCommand({
        cmdMeta: {
          input: {
            display: "Input setting...",
          },
        },
        configMeta: { displayString: "My Setting" },
      });

      //THEN
      expect(cmd.display).toEqual("Input setting...");
    });

    it("display is custom... if part of subgroup (without display override)", () => {
      //GIVEN

      //WHEN
      const cmd = buildCommand({
        cmdMeta: {
          input: {
            // display: "Input setting...",
          },
          subgroup: {
            options: [],
          },
        },
        configMeta: { displayString: "My Setting" },
      });

      //THEN
      expect(cmd.subgroup?.list[0]?.display).toEqual("custom...");
    });

    it("display is is using display override if part of subgroup", () => {
      //GIVEN

      //WHEN
      const cmd = buildCommand({
        cmdMeta: {
          input: {
            display: "Input setting...",
          },
          subgroup: {
            options: [],
          },
        },
        configMeta: { displayString: "My Setting" },
      });

      //THEN
      expect(cmd.subgroup?.list[0]?.display).toEqual("Input setting...");
    });

    it("uses inputValueConvert", () => {
      //GIVEN
      const schema = z.number().int();

      //WHEN
      const cmd = buildCommand({
        key: "test" as any,
        cmdMeta: { input: { inputValueConvert: Number } },
        schema,
      });

      //THEN
      expect(cmd).toEqual(
        expect.objectContaining({
          inputValueConvert: Number,
        }),
      );
    });

    it("uses validation from schema", () => {
      //GIVEN
      const schema = z.enum(["on", "off"]);

      //WHEN
      const cmd = buildCommand({
        key: "test" as any,
        cmdMeta: { input: { validation: { schema: true } } },
        schema,
      });

      expect(cmd).toEqual(
        expect.objectContaining({
          validation: { schema },
        }),
      );
    });

    it("does not use validation if empty", () => {
      //GIVEN
      const schema = z.enum(["on", "off"]);

      //WHEN
      const cmd = buildCommand({
        key: "test" as any,
        cmdMeta: { input: { validation: {} } },
        schema,
      });

      expect(cmd).toHaveProperty("validation", {});
    });

    it("uses validation by default", () => {
      //GIVEN
      const schema = z.enum(["on", "off"]);

      //WHEN
      const cmd = buildCommand({
        key: "test" as any,
        cmdMeta: { input: {} },
        schema,
      });

      expect(cmd).toEqual(
        expect.objectContaining({
          validation: { schema },
        }),
      );
    });

    it("uses validation with isValid", () => {
      //GIVEN
      const schema = z.enum(["on", "off"]);
      const isValid = (_val: any): Promise<boolean | string> =>
        Promise.resolve("error");

      //WHEN
      const cmd = buildCommand({
        key: "test" as any,
        cmdMeta: { input: { validation: { isValid: isValid } } },
        schema,
      });

      expect(cmd).toEqual(
        expect.objectContaining({
          validation: { isValid },
        }),
      );
    });

    it("uses secondKey", () => {
      //GIVEN
      const schema = z.enum(["on", "off"]);

      //WHEN
      const cmd = buildCommand({
        key: "test" as any,
        cmdMeta: {
          input: { secondKey: "mySecondKey" },
        },
        schema,
      });

      expect(cmd).toEqual(
        expect.objectContaining({
          id: "setMySecondKeyCustom",
          display: "MySecondKey...",
        }),
      );
    });
  });
});

function buildCommand<K extends ConfigKey>({
  cmdMeta,
  configMeta,
  schema,
  key,
}: {
  cmdMeta: Partial<CommandlineConfigMetadata<any, any>>;
  configMeta?: Partial<ConfigMetadata<K>>;
  schema?: ZodSchema;
  key?: K;
}) {
  return buildCommandForConfigKey(
    key ?? ("" as any),
    configMeta ?? ({} as any),
    cmdMeta as any,
    schema ?? z.string(),
  );
}
