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
            <div class="name">-</div>
            <div class="badges"></div>
            <div class="allBadges"></div>
            <div class="joined" data-balloon-pos="up">-</div>
	          <div class="streak" data-balloon-pos="up">-</div>
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
          <div
            class="userReportButton button"
            data-balloon-pos="left"
            aria-label="Report user"
          >
            <i class="fas fa-flag"></i>
          </div>
        </div>
      </div>
      <div class="leaderboardsPositions">
        <div class="title">All-Time English Leaderboards</div>
        <div class="group t15">
          <div class="testType">15 seconds</div>
          <div class="pos">-</div>
        </div>
        <div class="group t60">
          <div class="testType">60 seconds</div>
          <div class="pos">-</div>
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
      </div>`);
}

interface UpdateOptions {
  uidOrName?: string;
  data?: undefined | Profile.ProfileData;
}

async function update(options: UpdateOptions): Promise<void> {
  const getParamExists = checkIfGetParameterExists("isUid");
  if (options.data) {
    $(".page.pageProfile .preloader").addClass("hidden");
    Profile.update("profile", options.data);
    PbTables.update(options.data.personalBests, true);
  } else if (options.uidOrName) {
    const response =
      getParamExists === true
        ? await Ape.users.getProfileByUid(options.uidOrName)
        : await Ape.users.getProfileByName(options.uidOrName);
    $(".page.pageProfile .preloader").addClass("hidden");

    if (response.status === 404) {
      const message =
        getParamExists === true
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
    }

    Profile.update("profile", response.data);
    PbTables.update(response.data.personalBests, true);
  } else {
    Notifications.add("Missing update parameter!", -1);
  }
}

$(".page.pageProfile").on("click", ".profile .userReportButton", () => {
  const uid = $(".page.pageProfile .profile").attr("uid") ?? "";
  const name = $(".page.pageProfile .profile").attr("name") ?? "";

  UserReportPopup.show({ uid, name });
});

export const page = new Page<undefined | Profile.ProfileData>(
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
    Skeleton.append("pageProfile", "middle");
    const uidOrName = options?.params?.["uidOrName"];
    if (uidOrName) {
      $(".page.pageProfile .preloader").removeClass("hidden");
      $(".page.pageProfile .search").addClass("hidden");
      $(".page.pageProfile .content").removeClass("hidden");
      reset();
      update({
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
