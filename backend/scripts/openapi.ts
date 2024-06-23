import { generateOpenApi } from "@ts-rest/open-api";
import { contract } from "../../shared/contract/index.contract";
import { writeFileSync, mkdirSync } from "fs";

export function getOpenApi() {
  const openApiDocument = generateOpenApi(
    contract,
    {
      info: {
        title: "Monkeytype API",
        description:
          "Documentation for the public endpoints provided by the Monkeytype API server.\n\nNote that authentication is performed with the Authorization HTTP header in the format `Authorization: ApeKey YOUR_APE_KEY`\n\nThere is a rate limit of `30 requests per minute` across all endpoints with some endpoints being more strict. Rate limit rates are shared across all ape keys.",
        version: "2.0.0",
        termsOfService: "https://monkeytype.com/terms-of-service",
        contact: {
          name: "Support",
          email: "support@monkeytype.com",
        },
        "x-logo": {
          url: "https://monkeytype.com/images/mtfulllogo.png",
        },
      },
    },
    { jsonQuery: true, setOperationId: "concatenated-path" }
  );
  return openApiDocument;
}

//detect if we run this as a main
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error("Provide filename.");
    process.exit(1);
  }
  const outFile = args[0] as string;

  //create directories if needed
  const lastSlash = outFile.lastIndexOf("/");
  if (lastSlash > 1) {
    const dir = outFile.substring(0, lastSlash);
    mkdirSync(dir, { recursive: true });
  }

  const openapi = getOpenApi();
  writeFileSync(args[0] as string, JSON.stringify(openapi));
  //console.log(JSON.stringify(openapi));
}
