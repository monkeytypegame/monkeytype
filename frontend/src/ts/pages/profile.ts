import Ape from "../ape";
import Page from "./page";
import * as Profile from "../elements/profile";
import * as PbTables from "../elements/account/pb-tables";
import * as Notifications from "../elements/notifications";
import { checkIfGetParameterExists } from "../utils/misc";
import * as UserReportModal from "../modals/user-report";
import * as Skeleton from "../utils/skeleton";
import { UserProfile } from "@monkeytype/schemas/users";
import { PersonalBests } from "@monkeytype/schemas/shared";
import * as TestActivity from "../elements/test-activity";
import { TestActivityCalendar } from "../elements/test-activity-calendar";
import { getFirstDayOfTheWeek } from "../utils/date-and-time";
import { addFriend } from "./friends";
import { qsr } from "../utils/dom";

const firstDayOfTheWeek = getFirstDayOfTheWeek();

function reset(): void {
  $(".page.pageProfile .error").addClass("hidden");
  $(".page.pageProfile .preloader").removeClass("hidden");
  $(".page.pageProfile .profile").html(`
      <div class="details none">
        <div class="avatarAndName">
          <div class="avatar"></div>
          <div>
             <div class="user">
              <div class="name">-</div>
              <div class="userFlags"></div>
            </div>
            <div class="badges"></div>
            <div class="allBadges"></div>
            <div class="joined" data-balloon-pos="up">-</div>
	          <div class="streak" data-balloon-pos="up">-</div>
          </div>
          <div class="levelAndBar">
            <div class="level" data-balloon-pos="up">-</div>
            <div class="xpBar" data-balloon-pos="up">
              <div class="bar" style="width: 0%;"></div>
            </div>
            <div class="xp" data-balloon-pos="up">-/-</div>
          </div>
          <div class="levelAndBar">
            <div class="level">-</div>
            <div class="xpBar">
              <div class="bar" style="width: 0%;"></div>
            </div>
            <div class="xp" data-balloon-pos="up">-/-</div>
          </div>
        </div>
        <div class="separator sep1"></div>
        <div class="typingStats vertical">
          <div class="started">
            <div class="title">tests started</div>
            <div class="value">-</div>
          </div>
          <div class="completed">
            <div class="title">tests completed</div>
            <div class="value">-</div>
          </div>
          <div class="timeTyping">
            <div class="title">time typing</div>
            <div class="value">-</div>
          </div>
        </div>
        <div class="separator sep2 hidden"></div>

        <div class="bioAndKeyboard vertical hidden">
          <div class="bio">
            <div class="title">bio</div>
            <div class="value">-</div>
          </div>
          <div class="keyboard hidden">
            <div class="title">keyboard</div>
            <div class="value">-</div>
          </div>
        </div>
        <div class="separator sep3 hidden"></div>

        <div class="socials big hidden">
          <div class="title">socials</div>
          <div class="value">-</div>
        </div>
        <div class="buttonGroup">
          <button
            class="userReportButton hidden"
            data-balloon-pos="left"
            aria-label="Report user"
          >
            <i class="fas fa-flag"></i>
          </button>
          <button
            class="addFriendButton hidden"
            data-balloon-pos="left"
            aria-label="Send friend request"
          >
            <i class="fas fa-user-plus"></i>
          </button>
        </div>
      </div>
      <div class="leaderboardsPositions">
        <div class="title">All-Time English Leaderboards</div>
        <div class="group t15">
          <div class="testType">15 seconds</div>
          <div class="pos">-</div>
          <div class="topPercentage">-</div>
        </div>
        <div class="group t60">
          <div class="testType">60 seconds</div>
          <div class="pos">-</div>
          <div class="topPercentage">-</div>
        </div>
      </div>
      <div class="pbsWords">
        <div class="group">
          <div class="quick">
            <div class="test">10 words</div>
            <div class="wpm">-</div>
            <div class="acc">-</div>
          </div>
        </div>
        <div class="group">
          <div class="quick">
            <div class="test">25 words</div>
            <div class="wpm">-</div>
            <div class="acc">-</div>
          </div>
        </div>
        <div class="group">
          <div class="quick">
            <div class="test">50 words</div>
            <div class="wpm">-</div>
            <div class="acc">-</div>
          </div>
        </div>
        <div class="group">
          <div class="quick">
            <div class="test">100 words</div>
            <div class="wpm">-</div>
            <div class="acc">-</div>
          </div>
        </div>
      </div>
      <div class="pbsTime">
        <div class="group">
          <div class="quick">
            <div class="test">15 seconds</div>
            <div class="wpm">-</div>
            <div class="acc">-</div>
          </div>
        </div>
        <div class="group">
          <div class="quick">
            <div class="test">30 seconds</div>
            <div class="wpm">-</div>
            <div class="acc">-</div>
          </div>
        </div>
        <div class="group">
          <div class="quick">
            <div class="test">60 seconds</div>
            <div class="wpm">-</div>
            <div class="acc">-</div>
          </div>
        </div>
        <div class="group">
          <div class="quick">
            <div class="test">120 seconds</div>
            <div class="wpm">-</div>
            <div class="acc">-</div>
          </div>
        </div>
      </div><div class="lbOptOutReminder hidden"></div>
      `);

  const testActivityEl = document.querySelector(
    ".page.pageProfile .testActivity",
  );
  if (testActivityEl !== null) {
    TestActivity.clear(testActivityEl as HTMLElement);
  }
}

type UpdateOptions = {
  uidOrName?: string;
  data?: undefined | UserProfile;
};

async function update(options: UpdateOptions): Promise<void> {
  const getParamExists = checkIfGetParameterExists("isUid");
  if (options.data) {
    $(".page.pageProfile .preloader").addClass("hidden");
    await Profile.update("profile", options.data);
    PbTables.update(
      // this cast is fine because pb tables can handle the partial data inside user profiles
      options.data.personalBests as unknown as PersonalBests,
      true,
    );
  } else if (options.uidOrName !== undefined && options.uidOrName !== "") {
    const response = await Ape.users.getProfile({
      params: { uidOrName: options.uidOrName },
      query: { isUid: getParamExists },
    });

    $(".page.pageProfile .preloader").addClass("hidden");

    if (response.status === 404) {
      const message = getParamExists
        ? "User not found"
        : `User ${options.uidOrName} not found`;
      $(".page.pageProfile .preloader").addClass("hidden");
      $(".page.pageProfile .error").removeClass("hidden");
      $(".page.pageProfile .error .message").text(message);
    } else if (response.status === 200) {
      const profile = response.body.data;
      window.history.replaceState(null, "", `/profile/${profile.name}`);
      await Profile.update("profile", profile);
      // this cast is fine because pb tables can handle the partial data inside user profiles
      PbTables.update(profile.personalBests as unknown as PersonalBests, true);

      const testActivity = document.querySelector(
        ".page.pageProfile .testActivity",
      ) as HTMLElement;

      if (profile.testActivity !== undefined) {
        const calendar = new TestActivityCalendar(
          profile.testActivity.testsByDays,
          new Date(profile.testActivity.lastDay),
          firstDayOfTheWeek,
        );
        TestActivity.init(testActivity, calendar);
        const title = testActivity.querySelector(".top .title") as HTMLElement;
        title.innerHTML = title?.innerHTML + " in last 12 months";
      } else {
        TestActivity.clear(testActivity);
      }
    } else {
      // $(".page.pageProfile .failedToLoad").removeClass("hidden");
      Notifications.add("Failed to load profile: " + response.body.message, -1);
      return;
    }
  } else {
    Notifications.add("Missing update parameter!", -1);
  }
}

$(".page.pageProfile").on("click", ".profile .userReportButton", () => {
  const uid = $(".page.pageProfile .profile").attr("uid") ?? "";
  const name = $(".page.pageProfile .profile").attr("name") ?? "";
  const lbOptOut =
    ($(".page.pageProfile .profile").attr("lbOptOut") ?? "false") === "true";

  void UserReportModal.show({ uid, name, lbOptOut });
});

$(".page.pageProfile").on("click", ".profile .addFriendButton", async () => {
  const friendName = $(".page.pageProfile .profile").attr("name") ?? "";

  const result = await addFriend(friendName);

  if (result === true) {
    Notifications.add(`Request sent to ${friendName}`);
    $(".profile .details .addFriendButton").addClass("disabled");
  } else {
    Notifications.add(result, -1);
  }
});

export const page = new Page<undefined | UserProfile>({
  id: "profile",
  element: qsr(".page.pageProfile"),
  path: "/profile",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageProfile");
    reset();
  },
  beforeShow: async (options): Promise<void> => {
    Skeleton.append("pageProfile", "main");
    const uidOrName = options?.params?.["uidOrName"] ?? "";
    if (uidOrName) {
      $(".page.pageProfile .preloader").removeClass("hidden");
      $(".page.pageProfile .search").addClass("hidden");
      $(".page.pageProfile .content").removeClass("hidden");
      reset();
      void update({
        uidOrName,
        data: options?.data,
      });
    } else {
      $(".page.pageProfile .preloader").addClass("hidden");
      $(".page.pageProfile .search").removeClass("hidden");
      $(".page.pageProfile .content").addClass("hidden");
    }
  },
});

Skeleton.save("pageProfile");
