import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  CommonResponses,
  meta,
  MonkeyClientError,
  responseWithData,
} from "./util/api";
import {
  RaceConfigSchema,
  RaceRoomSchema,
  RoomCodeSchema,
} from "@monkeytype/schemas/multiplayer";

export const CreateRoomRequestSchema = z.object({
  config: RaceConfigSchema,
});
export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;

export const CreateRoomResponseSchema = responseWithData(RaceRoomSchema);
export type CreateRoomResponse = z.infer<typeof CreateRoomResponseSchema>;

export const GetRoomPathSchema = z.object({
  roomCode: RoomCodeSchema,
});
export type GetRoomPath = z.infer<typeof GetRoomPathSchema>;

export const GetRoomResponseSchema = responseWithData(RaceRoomSchema);
export type GetRoomResponse = z.infer<typeof GetRoomResponseSchema>;

const c = initContract();
export const multiplayerContract = c.router(
  {
    createRoom: {
      summary: "create a multiplayer race room",
      description: "Creates a new room and makes the caller its host",
      method: "POST",
      path: "/room",
      body: CreateRoomRequestSchema.strict(),
      responses: {
        200: CreateRoomResponseSchema,
      },
      metadata: meta({
        rateLimit: "multiplayerCreateRoom",
      }),
    },
    getRoom: {
      summary: "get a multiplayer race room",
      description: "Gets a room by its shareable code, used before joining",
      method: "GET",
      path: "/room/:roomCode",
      pathParams: GetRoomPathSchema,
      responses: {
        200: GetRoomResponseSchema,
        404: MonkeyClientError.describe("Room not found"),
      },
      metadata: meta({
        rateLimit: "multiplayerGetRoom",
      }),
    },
  },
  {
    pathPrefix: "/multiplayer",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "multiplayer",
    }),
    commonResponses: CommonResponses,
  },
);
