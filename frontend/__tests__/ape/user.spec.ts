import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ts/ape", () => ({
  default: { users: { get: vi.fn() } },
}));

import Ape from "../../src/ts/ape";
import { clearUserResponse, fetchUserFromApi } from "../../src/ts/ape/user";
import { setTestUserId } from "../__harness__/auth-user";

describe("fetchUserFromApi", () => {
  beforeEach(() => {
    setTestUserId("uid");
    clearUserResponse();
    vi.mocked(Ape.users.get).mockReset();
    vi.mocked(Ape.users.get).mockResolvedValue({
      status: 200,
      body: { message: "", data: { name: "name" } },
    } as never);
  });

  it("shares one download between readers", async () => {
    await Promise.all([fetchUserFromApi(), fetchUserFromApi()]);
    await fetchUserFromApi();
    expect(Ape.users.get).toHaveBeenCalledOnce();
  });

  it("downloads again after clearUserResponse", async () => {
    await fetchUserFromApi();
    clearUserResponse();
    await fetchUserFromApi();
    expect(Ape.users.get).toHaveBeenCalledTimes(2);
  });
});
