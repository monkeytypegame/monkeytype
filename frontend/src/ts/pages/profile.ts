import Ape from "../ape";
import Page from "./page";
import * as Profile from "../elements/profile";
import * as PbTables from "../elements/account/pb-tables";
import * as Notifications from "../elements/notifications";
import { checkIfGetParameterExists } from "../utils/misc";
import * as UserReportModal from "../modals/user-report";
import * as Skeleton from "../utils/skeleton";
import { UserProfile } from "@monkeytype/contracts/schemas/users";
import { PersonalBests } from "@monkeytype/contracts/schemas/shared";

function reset(): void {
  $(".page.pageProfile .preloader").removeClass("hidden");
  $(".page.pageProfile .profile").html(`
      <div class="details none">
        <div class="avatarAndName">
          <div class="avatars">
            <div class="placeholderAvatar">
              <i class="fas fa-user-circle"></i>
            </div>
            <div class="avatar"></div>
          </div>
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
            class="userReportButton"
            data-balloon-pos="left"
            aria-label="Report user"
          >
            <i class="fas fa-flag"></i>
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
      </div><div class="lbOptOutReminder hidden"></div>`);
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
      true
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
      window.history.replaceState(
        null,
        "",
        `/profile/${response.body.data.name}`
      );
      await Profile.update("profile", response.body.data);
      // this cast is fine because pb tables can handle the partial data inside user profiles
      PbTables.update(
        response.body.data.personalBests as unknown as PersonalBests,
        true
      );
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

export const page = new Page<undefined | UserProfile>({
  name: "profile",
  element: $(".page.pageProfile"),
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
