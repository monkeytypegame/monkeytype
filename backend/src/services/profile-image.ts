import { UserProfile } from "@monkeytype/contracts/schemas/users";
import { readFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";

import * as Mustache from "mustache";
import { format } from "date-fns";
import { PersonalBests } from "@monkeytype/contracts/schemas/shared";
import { isDevEnvironment } from "../utils/misc";

import { secondsToString } from "@monkeytype/util/date-and-time";
import { rank } from "@monkeytype/util/format";

let TEMPLATE: string | undefined = undefined;

const FALLBACK_IMAGE = readFileSync(
  join(__dirname, "../../static/templates/profile/user.png")
);

export async function getProfileImage(profile: UserProfile): Promise<Buffer> {
  const t15 = profile.allTimeLbs?.time?.["15"]?.["english"];
  const t60 = profile.allTimeLbs?.time?.["60"]?.["english"];
  const lb = {
    15: {
      rank: rank(t15?.rank),
    },
    60: {
      rank: rank(t60?.rank),
    },
  };
  const typingStats = {
    started: profile.typingStats.startedTests,
    completed: profile.typingStats.completedTests,
    timeTyping: secondsToString(
      Math.round(profile.typingStats?.timeTyping ?? 0),
      true,
      true
    ),
  };
  const pb = {
    time: {
      15: getPb(profile.personalBests, "time", 15),
      30: getPb(profile.personalBests, "time", 30),
      60: getPb(profile.personalBests, "time", 60),
      120: getPb(profile.personalBests, "time", 120),
    },
  };

  const data = {
    name: profile.name,
    joined: `Joined ${format(profile.addedAt ?? 0, "dd MMM yyyy")}`,
    lb,
    typingStats,
    pb,
  };
  const svgProfile = Buffer.from(Mustache.render(getTemplate(), data));

  const result = await sharp({
    create: {
      background: { r: 50, g: 52, b: 55 },
      channels: 3,
      height: 630,
      width: 1200,
    },
  })
    .composite([
      {
        input: await getProfilePicture(
          profile.discordId,
          profile.discordAvatar
        ),
        left: 62,
        top: 62,
        blend: "over",
      },
      { input: svgProfile, left: 32, top: 32, blend: "over" },
    ])
    .toFormat("png")
    .toBuffer();

  return result;
}

async function getProfilePicture(
  discordId?: string,
  discordAvatar?: string
): Promise<Buffer> {
  if (discordId === undefined || discordAvatar === undefined) {
    return Promise.resolve(FALLBACK_IMAGE);
  }
  const response = await fetch(
    `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png?size=128`
  );
  if (response.status !== 200) {
    return Promise.resolve(FALLBACK_IMAGE);
  }
  const data = (await response.arrayBuffer()) as Buffer;

  //discord api sometimes does not scale images for us
  return sharp(data).resize(120, 120).toBuffer();
}

function getPb(
  pbs: Pick<PersonalBests, "time">,
  mode: "time",
  mode2: number
): { acc: string; wpm: string } {
  const pbData = (pbs[mode][mode2] ?? []).sort((a, b) => b.wpm - a.wpm)[0];

  if (pbData === undefined)
    return {
      acc: "",
      wpm: "-",
    };

  return {
    acc: Math.round(pbData.acc).toString() + "%",
    wpm: Math.round(pbData.wpm).toString(),
  };
}

function getTemplate(): string {
  if (!isDevEnvironment() && TEMPLATE !== undefined) {
    return TEMPLATE;
  }
  TEMPLATE = readFileSync(
    join(__dirname, "../../static/templates/profile/profile.svg")
  ).toString();
  return TEMPLATE;
}
