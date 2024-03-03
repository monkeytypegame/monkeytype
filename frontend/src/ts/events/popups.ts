async function getCommandline(): Promise<
  typeof import("../commandline/commandline.ts")
> {
  return await import("../commandline/commandline");
}

$("#popups").on("click", "#supportMeWrapper button.ads", async () => {
  (await getCommandline()).show({ subgroupOverride: "enableAds" });
});

export {};
