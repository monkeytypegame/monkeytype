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

    const ls = new LocalStorageWithSchema({
      key: "config",
      schema: objectSchema,
      fallback: defaultObject,
    });

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

      const res = ls.set(obj as any);

      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(res).toBe(false);
    });

    it("should revert to the fallback value if localstorage is null", () => {
      getItemMock.mockReturnValue(null);

      const res = ls.get();

      expect(localStorage.getItem).toHaveBeenCalledWith("config");
      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(res).toEqual(defaultObject);
    });

    it("should revert to the fallback value and remove if localstorage json is malformed", () => {
      getItemMock.mockReturnValue("badjson");

      const res = ls.get();

      expect(localStorage.getItem).toHaveBeenCalledWith("config");
      expect(localStorage.removeItem).toHaveBeenCalledWith("config");
      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(res).toEqual(defaultObject);
    });

    it("should get from localStorage", () => {
      getItemMock.mockReturnValue(JSON.stringify(defaultObject));

      const res = ls.get();

      expect(localStorage.getItem).toHaveBeenCalledWith("config");
      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(res).toEqual(defaultObject);
    });

    it("should revert to fallback value if no migrate function and schema failed", () => {
      getItemMock.mockReturnValue(JSON.stringify({ hi: "hello" }));
      const ls = new LocalStorageWithSchema({
        key: "config",
        schema: objectSchema,
        fallback: defaultObject,
      });

      const res = ls.get();

      expect(localStorage.getItem).toHaveBeenCalledWith("config");
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "config",
        JSON.stringify(defaultObject)
      );
      expect(res).toEqual(defaultObject);
    });

    it("should migrate (when function is provided) if schema failed", () => {
      const existingValue = { hi: "hello" };

      getItemMock.mockReturnValue(JSON.stringify(existingValue));

      const migrated = {
        punctuation: false,
        mode: "time",
        fontSize: 1,
      };

      const migrateFnMock = vi.fn(() => migrated as any);

      const ls = new LocalStorageWithSchema({
        key: "config",
        schema: objectSchema,
        fallback: defaultObject,
        migrate: migrateFnMock,
      });

      const res = ls.get();

      expect(localStorage.getItem).toHaveBeenCalledWith("config");
      expect(migrateFnMock).toHaveBeenCalledWith(
        existingValue,
        expect.any(Array)
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "config",
        JSON.stringify(migrated)
      );
      expect(res).toEqual(migrated);
    });

    it("should revert to fallback if migration ran but schema still failed", () => {
      const existingValue = { hi: "hello" };

      getItemMock.mockReturnValue(JSON.stringify(existingValue));

      const invalidMigrated = {
        punctuation: 1,
        mode: "time",
        fontSize: 1,
      };

      const migrateFnMock = vi.fn(() => invalidMigrated as any);

      const ls = new LocalStorageWithSchema({
        key: "config",
        schema: objectSchema,
        fallback: defaultObject,
        migrate: migrateFnMock,
      });

      const res = ls.get();

      expect(localStorage.getItem).toHaveBeenCalledWith("config");
      expect(migrateFnMock).toHaveBeenCalledWith(
        existingValue,
        expect.any(Array)
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "config",
        JSON.stringify(defaultObject)
      );
      expect(res).toEqual(defaultObject);
    });
  });
});
