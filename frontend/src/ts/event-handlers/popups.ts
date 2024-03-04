async function getCommandline(): Promise<
  typeof import("../commandline/commandline.js")
> {
  return await import("../commandline/commandline.js");
}

$("#popups").on("click", "#supportMeWrapper button.ads", async () => {
  (await getCommandline()).show({ subgroupOverride: "enableAds" });
});

export {};
