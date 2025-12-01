import * as ResultDAL from "../../dal/result";
import {
  isDevEnvironment,
  replaceObjectId,
  replaceObjectIds,
} from "../../utils/misc";
import Logger from "../../utils/logger";
import "dotenv/config";
import { MonkeyResponse } from "../../utils/monkey-response";
import MonkeyError from "../../utils/error";
import { implemented as anticheatImplemented } from "../../anticheat/index";
import * as UserDAL from "../../dal/user";
import { addLog } from "../../dal/logs";
import {
  AddResultRequest,
  AddResultResponse,
  GetLastResultResponse,
  GetResultByIdPath,
  GetResultByIdResponse,
  GetResultsQuery,
  GetResultsResponse,
  UpdateResultTagsRequest,
  UpdateResultTagsResponse,
} from "@monkeytype/contracts/results";
import { MonkeyRequest } from "../types";

try {
  if (!anticheatImplemented()) throw new Error("undefined");
  Logger.success("Anticheat module loaded");
} catch (e) {
  if (isDevEnvironment()) {
    Logger.warning(
      "No anticheat module found. Continuing in dev mode, results will not be validated."
    );
  } else {
    Logger.error(
      "No anticheat module found. To continue in dev mode, add MODE=dev to your .env file in the backend directory"
    );
    process.exit(1);
  }
}

export async function getResults(
  req: MonkeyRequest<GetResultsQuery>
): Promise<GetResultsResponse> {
  const { uid } = req.ctx.decodedToken;
  const premiumFeaturesEnabled = req.ctx.configuration.users.premium.enabled;
  const { onOrAfterTimestamp = NaN, offset = 0 } = req.query;
  const userHasPremium = await UserDAL.checkIfUserIsPremium(uid);

  const maxLimit =
    premiumFeaturesEnabled && userHasPremium
      ? req.ctx.configuration.results.limits.premiumUser
      : req.ctx.configuration.results.limits.regularUser;

  let limit =
    req.query.limit ??
    Math.min(req.ctx.configuration.results.maxBatchSize, maxLimit);

  //check if premium features are disabled and current call exceeds the limit for regular users
  if (
    userHasPremium &&
    !premiumFeaturesEnabled &&
    limit + offset > req.ctx.configuration.results.limits.regularUser
  ) {
    throw new MonkeyError(503, "Premium feature disabled.");
  }

  if (limit + offset > maxLimit) {
    if (offset < maxLimit) {
      //batch is partly in the allowed ranged. Set the limit to the max allowed and return partly results.
      limit = maxLimit - offset;
    } else {
      throw new MonkeyError(422, `Max results limit of ${maxLimit} exceeded.`);
    }
  }

  const results = await ResultDAL.getResults(uid, {
    onOrAfterTimestamp,
    limit,
    offset,
  });
  void addLog(
    "user_results_requested",
    {
      limit,
      offset,
      onOrAfterTimestamp,
      isPremium: userHasPremium,
    },
    uid
  );

  return new MonkeyResponse("Results retrieved", replaceObjectIds(results));
}

export async function getResultById(
  req: MonkeyRequest<undefined, undefined, GetResultByIdPath>
): Promise<GetResultByIdResponse> {
  const { uid } = req.ctx.decodedToken;
  const { resultId } = req.params;

  const result = await ResultDAL.getResult(uid, resultId);
  return new MonkeyResponse("Result retrieved", replaceObjectId(result));
}

export async function getLastResult(
  req: MonkeyRequest
): Promise<GetLastResultResponse> {
  const { uid } = req.ctx.decodedToken;
  const result = await ResultDAL.getLastResult(uid);
  return new MonkeyResponse("Result retrieved", replaceObjectId(result));
}

export async function deleteAll(req: MonkeyRequest): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  await ResultDAL.deleteAll(uid);
  void addLog("user_results_deleted", "", uid);
  return new MonkeyResponse("All results deleted", null);
}

export async function updateTags(
  req: MonkeyRequest<undefined, UpdateResultTagsRequest>
): Promise<UpdateResultTagsResponse> {
  const { uid } = req.ctx.decodedToken;
  const { tagIds, resultId } = req.body;

  await ResultDAL.updateTags(uid, resultId, tagIds);
  const result = await ResultDAL.getResult(uid, resultId);

  if (!result.difficulty) {
    result.difficulty = "normal";
  }
  if (!(result.language ?? "")) {
    result.language = "english";
  }
  if (result.funbox === undefined) {
    result.funbox = [];
  }
  if (!result.lazyMode) {
    result.lazyMode = false;
  }
  if (!result.punctuation) {
    result.punctuation = false;
  }
  if (!result.numbers) {
    result.numbers = false;
  }

  const user = await UserDAL.getPartialUser(uid, "update tags", ["tags"]);
  const tagPbs = await UserDAL.checkIfTagPb(uid, user, result);
  return new MonkeyResponse("Result tags updated", {
    tagPbs,
  });
}

export async function addResult(
  _req: MonkeyRequest<undefined, AddResultRequest>
): Promise<AddResultResponse> {
  // todo remove
  return new MonkeyResponse("Result added", {
    isPb: false,
    tagPbs: [],
    insertedId: "",
    xp: 0,
    dailyXpBonus: false,
    xpBreakdown: {},
    streak: 0,
  });
}
