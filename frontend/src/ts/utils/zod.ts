import {
  z,
  ZodBranded,
  ZodDefault,
  ZodEffects,
  ZodFirstPartyTypeKind,
  ZodNullable,
  ZodOptional,
  ZodSchema,
  ZodTypeAny,
} from "zod";

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
 * Unwraps a Zod schema by removing wrappers like optional, default, nullable,
 * returning the underlying inner schema.
 **/
export function unwrapSchema(schema: ZodTypeAny): ZodTypeAny {
  let current = schema;

  while (true) {
    if (current instanceof ZodOptional) {
      current = current.unwrap() as ZodTypeAny;
      continue;
    }
    if (current instanceof ZodDefault) {
      current = current.removeDefault() as ZodTypeAny;
      continue;
    }
    if (current instanceof ZodNullable) {
      current = current.unwrap() as ZodTypeAny;
      continue;
    }
    if (current instanceof ZodEffects) {
      current = current.innerType() as ZodTypeAny;
      continue;
    }
    if (current instanceof ZodBranded) {
      current = current.unwrap() as ZodTypeAny;
      continue;
    }

    break;
  }

  return current;
}
