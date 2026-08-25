import { Page } from "../../common/Page";
import { FriendsList } from "./FriendsList";
import { PendingRequests } from "./PendingRequests";

export function FriendsPage() {
  return (
    <Page id="friends">
      <div class="content-grid grid gap-8">
        <PendingRequests />
        <FriendsList />
      </div>
    </Page>
  );
}
