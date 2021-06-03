# Mongo todo

## Todo

Make sure that the branch is ready for deployment

- Add deploy script(s) to package.json
- Create a plan for apache/nginx server
  - Api should be accessible via api.monkeytype.com
- Add helmet middleware to express api?

## Bugs

- Some methods in functions/index.js may be broken
  - I think bot commands like lbUpdate and such
  - Make sure discord can work
    - Might just want to call the api from discord bot instead of firebase functions

### Minor/efficiency bugs

- Does clearDailyLeaderboards cause a memory leak?
- Is filteredResults.reverse(); in account.js going to cause efficiency issues?
  - For loop in account could work backwards instead, but this would add complexity
- Why does `if (page == "account") pageTransition = false;` get rid of endless account loading bug when accessing via url
- Name is not passed in user token/auth().currentUser
- Account button sometimes shows loading infinitely after a test
  - Can't navigate to user until page is refreshed
  - After refresh, pr is not saved
  - Can't induce this error and doesn't occur often so adding it as minor bug
- lbmemory undefined if page not refreshed after user sign up?
- If you are in first place and you place on the leaderboard but not above yourself, you get glb undefined error
  - Might also occur if you are simply on the leaderboard and make the leaderboard but not above your current position
  - Doesn't happen all the time
- Hidden property of leaderboard is unused
- Verified property of user is unused, set at false by default
  - Can't find where the property would be set in the code
  - Is this discord verified, if so, why do you need discord verified to be on leaderboard?
    - Temporarily removed from leaderboard requirements

### Possibilities

- Might be worthwhile to use redis to store userdata up to a certain point
  - Users who have been requested in the last hour will be stored in the redis database so that their data can be sent again without having to search a large database
    - After an hour without a new request they can be removed from memory
- Create a backup system to prevent loss of data
  - Users should be able to export their data themselves
    - Pretty much is just the user snap but without uid
