import { Collection } from "mongodb";
import * as db from "../init/db";
import { createHash } from "crypto";
import { User } from "@monkeytype/contracts/schemas/users";
import { WithObjectId } from "../utils/misc";

type BlocklistEntryProperties = Pick<User, "name" | "email" | "discordId">;

type BlocklistEntry = {
  _id: string;
  usernameHash?: string;
  emailHash?: string;
  discordIdHash?: string;
  timestamp: number;
};

type DBBlocklistEntry = WithObjectId<BlocklistEntry>;

// Export for use in tests
export const getCollection = (): Collection<DBBlocklistEntry> =>
  db.collection("blocklist");

export async function add(user: BlocklistEntryProperties): Promise<void> {
  const timestamp = Date.now();
  const inserts: Promise<unknown>[] = [];

  const usernameHash = hash(user.name);
  const emailHash = hash(user.email);
  inserts.push(
    getCollection().replaceOne(
      { usernameHash },
      {
        usernameHash,
        timestamp,
      },
      { upsert: true }
    ),
    getCollection().replaceOne(
      { emailHash },
      {
        emailHash,
        timestamp,
      },
      { upsert: true }
    )
  );

  if (user.discordId !== undefined && user.discordId !== "") {
    const discordIdHash = hash(user.discordId);
    inserts.push(
      getCollection().replaceOne(
        { discordIdHash },
        {
          discordIdHash,
          timestamp,
        },
        { upsert: true }
      )
    );
  }
  await Promise.all(inserts);
}

export async function remove(
  user: Partial<BlocklistEntryProperties>
): Promise<void> {
  const filter = getFilter(user);
  if (filter.length === 0) return;
  await getCollection().deleteMany({ $or: filter });
}

export async function contains(
  user: Partial<BlocklistEntryProperties>
): Promise<boolean> {
  const filter = getFilter(user);
  if (filter.length === 0) return false;

  return (
    (await getCollection().countDocuments({
      $or: filter,
    })) !== 0
  );
}
export function hash(value: string): string {
  return createHash("sha256").update(value.toLocaleLowerCase()).digest("hex");
}

function getFilter(
  user: Partial<BlocklistEntryProperties>
): Partial<DBBlocklistEntry>[] {
  const filter: Partial<DBBlocklistEntry>[] = [];
  if (user.email !== undefined) {
    filter.push({ emailHash: hash(user.email) });
  }
  if (user.name !== undefined) {
    filter.push({ usernameHash: hash(user.name) });
  }
  if (user.discordId !== undefined) {
    filter.push({ discordIdHash: hash(user.discordId) });
  }
  return filter;
}

export async function createIndicies(): Promise<void> {
  await getCollection().createIndex(
    { usernameHash: 1 },
    {
      unique: true,
      partialFilterExpression: { usernameHash: { $exists: true } },
    }
  );
  await getCollection().createIndex(
    { emailHash: 1 },
    {
      unique: true,
      partialFilterExpression: { emailHash: { $exists: true } },
    }
  );
  await getCollection().createIndex(
    { discordIdHash: 1 },
    {
      unique: true,
      partialFilterExpression: { discordIdHash: { $exists: true } },
    }
  );
}
