import Ape from "../ape";
import Page from "./page";
import * as Profile from "../elements/profile";
import * as PbTables from "../account/pb-tables";
import * as Notifications from "../elements/notifications";
import { checkIfGetParameterExists } from "../utils/misc";
import * as UserReportPopup from "../popups/user-report-popup";
import * as Skeleton from "../popups/skeleton";

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
            <h2 class="name">-</h2>
            <div class="badges"></div>
            <div class="allBadges"></div>
            <p class="joined" data-balloon-pos="up">-</p>
	          <p class="streak" data-balloon-pos="up">-</p>
          </div>
          <div class="levelAndBar">
            <h3 class="level">-</h3>
            <div class="xpBar">
              <div class="bar" style="width: 0%;"></div>
            </div>
            <p class="xp" data-balloon-pos="up">-/-</p>
          </div>
        </div>
        <div class="separator sep1"></div>
        <div class="typingStats vertical">
          <div class="started">
            <h3 class="title">tests started</h3>
            <p class="value">-</p>
          </div>
          <div class="completed">
            <h3 class="title">tests completed</h3>
            <p class="value">-</p>
          </div>
          <div class="timeTyping">
            <h3 class="title">time typing</h3>
            <p class="value">-</p>
          </div>
        </div>
        <div class="separator sep2 hidden"></div>

        <div class="bioAndKeyboard vertical hidden">
          <div class="bio">
            <h3 class="title">bio</h3>
            <p class="value">-</p>
          </div>
          <div class="keyboard hidden">
            <h3 class="title">keyboard</h3>
            <p class="value">-</p>
          </div>
        </div>
        <div class="separator sep3 hidden"></div>

        <div class="socials big hidden">
          <h3 class="title">socials</h3>
          <p class="value">-</p>
        </div>
        <div class="buttonGroup">
          <button
            type="button"
            class="userReportButton"
            data-balloon-pos="left"
            aria-label="Report user"
          >
            <i class="fas fa-flag"></i>
          </button>
        </div>
      </div>
      <div class="leaderboardsPositions">
        <h2 class="title">All-Time English Leaderboards</h2>
        <div class="group t15">
          <h3 class="testType">15 seconds</h3>
          <p class="pos">-</p>
        </div>
        <div class="group t60">
          <h3 class="testType">60 seconds</h3>
          <p class="pos">-</p>
        </div>
      </div>
      <div class="pbsWords">
        <div class="group">
          <div class="quick">
            <h3 class="test">10 words</h3>
            <p class="wpm">-</p>
            <p class="acc">-</p>
          </div>
        </div>
        <div class="group">
          <div class="quick">
            <h3 class="test">25 words</h3>
            <p class="wpm">-</p>
            <p class="acc">-</p>
          </div>
        </div>
        <div class="group">
          <div class="quick">
            <h3 class="test">50 words</h3>
            <p class="wpm">-</p>
            <p class="acc">-</p>
          </div>
        </div>
        <div class="group">
          <div class="quick">
            <h3 class="test">100 words</h3>
            <p class="wpm">-</p>
            <p class="acc">-</p>
          </div>
        </div>
      </div>
      <div class="pbsTime">
        <div class="group">
          <div class="quick">
            <h3 class="test">15 seconds</h3>
            <p class="wpm">-</p>
            <p class="acc">-</p>
          </div>
        </div>
        <div class="group">
          <div class="quick">
            <h3 class="test">30 seconds</h3>
            <p class="wpm">-</p>
            <p class="acc">-</p>
          </div>
        </div>
        <div class="group">
          <div class="quick">
            <h3 class="test">60 seconds</h3>
            <p class="wpm">-</p>
            <p class="acc">-</p>
          </div>
        </div>
        <div class="group">
          <div class="quick">
            <h3 class="test">120 seconds</h3>
            <p class="wpm">-</p>
            <p class="acc">-</p>
          </div>
        </div>
      </div><div class="lbOptOutReminder hidden"></div>`);
}

type UpdateOptions = {
  uidOrName?: string;
  data?: undefined | SharedTypes.UserProfile;
};

async function update(options: UpdateOptions): Promise<void> {
  const getParamExists = checkIfGetParameterExists("isUid");
  if (options.data) {
    $(".page.pageProfile .preloader").addClass("hidden");
    await Profile.update("profile", options.data);
    PbTables.update(
      // this cast is fine because pb tables can handle the partial data inside user profiles
      options.data.personalBests as unknown as SharedTypes.PersonalBests,
      true
    );
  } else if (options.uidOrName !== undefined && options.uidOrName !== "") {
    const response = getParamExists
      ? await Ape.users.getProfileByUid(options.uidOrName)
      : await Ape.users.getProfileByName(options.uidOrName);
    $(".page.pageProfile .preloader").addClass("hidden");

    if (response.status === 404 || response.data === null) {
      const message = getParamExists
        ? "User not found"
        : `User ${options.uidOrName} not found`;
      $(".page.pageProfile .preloader").addClass("hidden");
      $(".page.pageProfile .error").removeClass("hidden");
      $(".page.pageProfile .error .message").text(message);
    } else if (response.status !== 200) {
      // $(".page.pageProfile .failedToLoad").removeClass("hidden");
      return Notifications.add(
        "Failed to load profile: " + response.message,
        -1
      );
    } else {
      window.history.replaceState(null, "", `/profile/${response.data.name}`);
      await Profile.update("profile", response.data);
      // this cast is fine because pb tables can handle the partial data inside user profiles
      PbTables.update(
        response.data.personalBests as unknown as SharedTypes.PersonalBests,
        true
      );
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

  void UserReportPopup.show({ uid, name, lbOptOut });
});

export const page = new Page<undefined | SharedTypes.UserProfile>(
  "profile",
  $(".page.pageProfile"),
  "/profile",
  async () => {
    //
  },
  async () => {
    Skeleton.remove("pageProfile");
    reset();
  },
  async (options) => {
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
  async () => {
    //
  }
);

Skeleton.save("pageProfile");
