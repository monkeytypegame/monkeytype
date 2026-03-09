import "@tanstack/solid-form";

declare module "@tanstack/solid-form" {
  //This needs to be an interface
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface FieldMeta<TValue, TError> {
    hasWarning?: boolean;
    warnings?: string[];
  }
}
