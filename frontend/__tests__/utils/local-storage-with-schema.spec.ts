import { z } from "zod";
import { LocalStorageWithSchema } from "../../src/ts/utils/local-storage-with-schema";

describe("local-storage-with-schema.ts", () => {
  describe("LocalStorageWithSchema", () => {
    const objectSchema = z.object({
      punctuation: z.boolean(),
      mode: z.enum(["words", "time"]),
      fontSize: z.number(),
    });

    const defaultObject: z.infer<typeof objectSchema> = {
      punctuation: true,
      mode: "words",
      fontSize: 16,
    };

    const ls = new LocalStorageWithSchema(
      "config",
      objectSchema,
      () => defaultObject
    );

    const getItemMock = vi.fn();
    const setItemMock = vi.fn();
    const removeItemMock = vi.fn();

    vi.stubGlobal("localStorage", {
      getItem: getItemMock,
      setItem: setItemMock,
      removeItem: removeItemMock,
    });

    afterEach(() => {
      getItemMock.mockReset();
      setItemMock.mockReset();
      removeItemMock.mockReset();
    });

    it("should save to localStorage if schema is correct and return true", () => {
      const res = ls.set(defaultObject);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "config",
        JSON.stringify(defaultObject)
      );
      expect(res).toBe(true);
    });

    it("should fail to save to localStorage if schema is incorrect and return false", () => {
      const obj = {
        hi: "hello",
      };

      //@ts-expect-error
      const res = ls.set(obj);

      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(res).toBe(false);
    });

    it("should return undefined if localstorage json is malformed and remove from localstorage", () => {
      getItemMock.mockReturnValue("badjson");

      const res = ls.get();

      expect(localStorage.getItem).toHaveBeenCalledWith("config");
      expect(localStorage.removeItem).toHaveBeenCalledWith("config");
      expect(res).toEqual(undefined);

      const res2 = ls.get();

      expect(localStorage.getItem).toHaveBeenCalledWith("config");
      expect(localStorage.removeItem).toHaveBeenCalledWith("config");
      expect(res2).toEqual(undefined);
    });

    it("should get from localStorage", () => {
      getItemMock.mockReturnValue(JSON.stringify(defaultObject));

      const res = ls.get();

      expect(localStorage.getItem).toHaveBeenCalledWith("config");
      expect(res).toEqual(defaultObject);
    });

    it("should call onSchemaFail if provided", () => {
      getItemMock.mockReturnValue(JSON.stringify({ hi: "hello" }));

      const res = ls.get();

      expect(localStorage.getItem).toHaveBeenCalledWith("config");
      expect(res).toEqual(defaultObject);
    });

    it("should return undefined on schema fail and if no onSchemaFail was provided remove from localstorage", () => {
      const ls = new LocalStorageWithSchema("config", objectSchema);
      getItemMock.mockReturnValue(JSON.stringify({ hi: "hello" }));

      const res = ls.get();

      expect(localStorage.getItem).toHaveBeenCalledWith("config");
      expect(localStorage.removeItem).toHaveBeenCalledWith("config");
      expect(res).toEqual(undefined);
    });

    it("should remove from localStorage if onSchemaFail returned undefined", () => {
      const ls = new LocalStorageWithSchema(
        "config",
        objectSchema,
        () => undefined
      );
      getItemMock.mockReturnValue(JSON.stringify({ hi: "hello" }));

      const res = ls.get();

      expect(localStorage.getItem).toHaveBeenCalledWith("config");
      expect(localStorage.removeItem).toHaveBeenCalledWith("config");
      expect(res).toEqual(undefined);
    });
  });
});
