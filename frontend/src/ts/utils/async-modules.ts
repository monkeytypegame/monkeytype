export async function getCommandline(): Promise<
  typeof import("../commandline/commandline.js")
> {
  return await import("../commandline/commandline.js");
}
