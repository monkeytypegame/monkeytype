import Ape from "../ape";
import Page from "./page";
import * as Profile from "../elements/profile";
import * as PbTables from "../account/pb-tables";
import * as Notifications from "../elements/notifications";

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
	        <div class="streak">-</div>
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

async function update(userId: string): Promise<void> {
  const response = await Ape.users.getProfile(userId ?? "");
  $(".page.pageProfile .preloader").addClass("hidden");

  if (response.status !== 200) {
    // $(".page.pageProfile .failedToLoad").removeClass("hidden");
    return Notifications.add("Failed to load profile: " + response.message, -1);
  }

  Profile.update("profile", response.data);
  PbTables.update(response.data.personalBests, true);
}

export const page = new Page(
  "profile",
  $(".page.pageProfile"),
  "/profile",
  async () => {
    //
  },
  async () => {
    reset();
  },
  async (params) => {
    reset();
    update(params?.["uid"] ?? "");
  },
  async () => {
    //
  }
);
