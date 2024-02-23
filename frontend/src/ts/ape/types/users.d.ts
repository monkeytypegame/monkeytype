/* eslint-disable @typescript-eslint/no-unused-vars */
// for some reason when using the dot notaion, the types are not being recognized as used
declare namespace Ape.Users {
  type GetUser = SharedTypes.User & {
    inboxUnreadSize: number;
    isPremium: boolean;
  };
  type GetOauthLink = {
    url: string;
  };
  type LinkDiscord = {
    discordId: string;
    discordAvatar: string;
  };
  type GetInbox = {
    inbox: SharedTypes.MonkeyMail[] | undefined;
  };
}
