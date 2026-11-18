import { FriendsList } from "./FriendsList";
import { PendingRequests } from "./PendingRequests";

export function FriendsPage() {
  return (
    <div class="content-grid grid gap-8">
      <PendingRequests />
      <FriendsList />
    </div>
  );
}
