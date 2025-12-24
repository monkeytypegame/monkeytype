// Quick test to see what commands are being built
import { buildCommandForConfigKey } from "./src/ts/commandline/util.js";

const tribeDelta = buildCommandForConfigKey("tribeDelta");
console.log("tribeDelta command:");
console.log("  id:", tribeDelta.id);
console.log("  minimumSearchQuery:", tribeDelta.minimumSearchQuery);
console.log("  available:", tribeDelta.available);
