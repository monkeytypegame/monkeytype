import { z, ZodFirstPartyTypeKind, ZodSchema, ZodTypeAny } from "zod";

export function getOptions<T extends ZodSchema>(
  schema: T,
): undefined | z.infer<T>[] {
  if (schema instanceof z.ZodLiteral) {
    return [schema.value] as z.infer<T>[];
  } else if (schema instanceof z.ZodEnum) {
    return schema.options as z.infer<T>[];
  } else if (schema instanceof z.ZodBoolean) {
    return [false, true] as z.infer<T>[];
  } else if (schema instanceof z.ZodUnion) {
    return (schema.options as ZodSchema[])
      .flatMap(getOptions)
      .filter((it) => it !== undefined) as z.infer<T>[];
  }
  return undefined;
}

export function getZodType(schema: ZodTypeAny): ZodFirstPartyTypeKind {
  // oxlint-disable-next-line typescript/no-unsafe-assignment typescript/no-unsafe-member-access
  return schema._def["typeName"] as ZodFirstPartyTypeKind;
}

/**
 * Unwraps a Zod schema by removing optional or default wrappers,
 * returning the underlying inner schema.
 **/
export function unwrapSchema<T extends ZodTypeAny>(schema: T): T {
  const type = getZodType(schema);

  if (
    type === ZodFirstPartyTypeKind.ZodOptional ||
    type === ZodFirstPartyTypeKind.ZodDefault
  ) {
    // oxlint-disable-next-line typescript/no-unsafe-assignment typescript/no-unsafe-member-access
    return schema._def["innerType"] as T;
  }

  return schema;
}
