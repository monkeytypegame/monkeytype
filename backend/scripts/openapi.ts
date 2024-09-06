import { generateOpenApi } from "@ts-rest/open-api";
import { contract } from "@monkeytype/contracts/index";
import { writeFileSync, mkdirSync } from "fs";
import {
  ApeKeyRateLimit,
  EndpointMetadata,
} from "@monkeytype/contracts/schemas/api";
import type { OpenAPIObject } from "openapi3-ts";
import {
  getLimits,
  limits,
  RateLimit,
  Window,
} from "@monkeytype/contracts/rate-limit/index";
import { formatDuration } from "date-fns";

type SecurityRequirementObject = {
  [name: string]: string[];
};

export function getOpenApi(): OpenAPIObject {
  const openApiDocument = generateOpenApi(
    contract,
    {
      openapi: "3.1.0",
      info: {
        title: "Monkeytype API",
        description:
          "Documentation for the endpoints provided by the Monkeytype API server.\n\nNote that authentication is performed with the Authorization HTTP header in the format `Authorization: ApeKey YOUR_APE_KEY`\n\nThere is a rate limit of `30 requests per minute` across all endpoints with some endpoints being more strict. Rate limit rates are shared across all ape keys.",
        version: "2.0.0",
        termsOfService: "https://monkeytype.com/terms-of-service",
        contact: {
          name: "Support",
          email: "support@monkeytype.com",
        },
        "x-logo": {
          url: "https://monkeytype.com/images/mtfulllogo.png",
        },
        license: {
          name: "GPL-3.0",
          url: "https://www.gnu.org/licenses/gpl-3.0.html",
        },
      },
      servers: [
        {
          url: "https://api.monkeytype.com",
          description: "Production server",
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
          },
          ApeKey: {
            type: "http",
            scheme: "ApeKey",
          },
        },
      },
      tags: [
        {
          name: "users",
          description: "User account data.",
          "x-displayName": "Users",
          "x-public": "yes",
        },
        {
          name: "configs",
          description:
            "User specific configs like test settings, theme or tags.",
          "x-displayName": "User configs",
          "x-public": "no",
        },
        {
          name: "presets",
          description: "User specific configuration presets.",
          "x-displayName": "User presets",
          "x-public": "no",
        },
        {
          name: "results",
          description: "User test results",
          "x-displayName": "Test results",
          "x-public": "yes",
        },
        {
          name: "ape-keys",
          description: "Ape keys provide access to certain API endpoints.",
          "x-displayName": "Ape Keys",
          "x-public": "no",
        },
        {
          name: "public",
          description: "Public endpoints such as typing stats.",
          "x-displayName": "Public",
          "x-public": "yes",
        },
        {
          name: "leaderboards",
          description: "All-time and daily leaderboards of the fastest typers.",
          "x-displayName": "Leaderboards",
        },
        {
          name: "psas",
          description: "Public service announcements.",
          "x-displayName": "PSAs",
          "x-public": "yes",
        },
        {
          name: "quotes",
          description: "Quote ratings and new quote submissions",
          "x-displayName": "Quotes",
          "x-public": "yes",
        },
        {
          name: "admin",
          description:
            "Various administrative endpoints. Require user to have admin permissions.",
          "x-displayName": "Admin",
          "x-public": "no",
        },
        {
          name: "configuration",
          description: "Server configuration",
          "x-displayName": "Server configuration",
          "x-public": "yes",
        },
        {
          name: "development",
          description:
            "Development related endpoints. Only available on dev environment",
          "x-displayName": "Development",
          "x-public": "no",
        },
      ],
    },

    {
      jsonQuery: true,
      setOperationId: "concatenated-path",
      operationMapper: (operation, route) => {
        const metadata = route.metadata as EndpointMetadata;

        addRateLimit(operation, metadata);

        const result = {
          ...operation,
          ...addAuth(metadata),
          ...addTags(metadata),
        };

        return result;
      },
    }
  );
  return openApiDocument;
}

function addAuth(metadata: EndpointMetadata | undefined): object {
  const auth = metadata?.["authenticationOptions"] ?? {};
  const security: SecurityRequirementObject[] = [];
  if (!auth.isPublic === true && !auth.isPublicOnDev === true) {
    security.push({ BearerAuth: [] });

    if (auth.acceptApeKeys === true) {
      security.push({ ApeKey: [] });
    }
  }

  const includeInPublic = auth.isPublic === true || auth.acceptApeKeys === true;
  return {
    "x-public": includeInPublic ? "yes" : "no",
    security,
  };
}

function addTags(metadata: EndpointMetadata | undefined): object {
  if (metadata === undefined || metadata.openApiTags === undefined) return {};
  return {
    tags: Array.isArray(metadata.openApiTags)
      ? metadata.openApiTags
      : [metadata.openApiTags],
  };
}

function addRateLimit(operation, metadata: EndpointMetadata | undefined): void {
  if (metadata === undefined || metadata.rateLimit === undefined) return;
  const okResponse = operation.responses["200"];
  if (okResponse === undefined) return;

  if (!operation.description.trim().endsWith(".")) operation.description += ".";

  operation.description += getRateLimitDescription(metadata.rateLimit);

  okResponse["headers"] = {
    ...okResponse["headers"],
    "x-ratelimit-limit": {
      schema: { type: "integer" },
      description: "The number of allowed requests in the current period",
    },
    "x-ratelimit-remaining": {
      schema: { type: "integer" },
      description: "The number of remaining requests in the current period",
    },
    "x-ratelimit-reset": {
      schema: { type: "integer" },
      description: "The timestamp of the start of the next period",
    },
  };
}

function getRateLimitDescription(limit: RateLimit | ApeKeyRateLimit): string {
  const limits = getLimits(limit);

  let result = ` This operation can be called up to ${
    limits.limiter.max
  } times ${formatWindow(limits.limiter.window)} for regular users`;

  if (limits.apeKeyLimiter !== undefined) {
    result += ` and up to ${limits.apeKeyLimiter.max} times ${formatWindow(
      limits.apeKeyLimiter.window
    )} with ApeKeys`;
  }

  return result + ".";
}

function formatWindow(window: Window): string {
  if (typeof window === "number") {
    const seconds = Math.floor(window / 1000);
    const duration = formatDuration({
      hours: Math.floor(seconds / 3600),
      minutes: Math.floor(seconds / 60) % 60,
      seconds: seconds % 60,
    });

    return `every ${duration}`;
  }
  switch (window) {
    case "per-second":
      return "per second";
    case "per-minute":
      return "per minute";
    case "hourly":
      return "per hour";
    case "daily":
      return "per day";
    default:
      return window;
  }
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
  writeFileSync(args[0] as string, JSON.stringify(openapi, null, 2));
}
