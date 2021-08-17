# Mongo todo

## Todo

- Make sure that the branch is ready for deployment
- Make sure that the bot can interact with the data on the express server
  - Would be optimal if the bot were to run on the same server as the express server, so that the bot wouldn't have to access data through api routes
- Determine if generatePairingCode should be removed or migrated
  - This function was commented out in index.js but is used in frontend

## Bugs

- Make sure that the bot is able to interact with the mongo database
  - If bot is on same server, it could work with mongo directly, otherwise, more api routes are needed
- Do names have to be made lowercase before checking if a duplicate name is found?(that is when a new user is created or username is changed)

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
- If you are in first place and you place on the leaderboard but not above yourself, you may get glb undefined error
  - Might also occur if you are simply on the leaderboard and make the leaderboard but not above your current position
  - Doesn't happen all the time
- Hidden property of leaderboard is unused
- Verified property of user is unused, set at false by default
  - Can't find where the property would be set in the code
  - Is this discord verified, if so, why do you need discord verified to be on leaderboard?
    - Temporarily removed from leaderboard requirements

### Functions not found anywhere except for index.js

Might need to be migrated, might not. I'm not sure why these are in the file if they are not being used.

- getAllNames
- getAllUsers
- getPatreons
- requestTest
- incrementStartedTestCounter
- incrementTestCounter

### Possibilities

- Might be worthwhile to use redis to store userdata up to a certain point
  - Users who have been requested in the last hour will be stored in the redis database so that their data can be sent again without having to search a large database
    - After an hour without a new request they can be removed from memory
- Create a backup system to prevent loss of data
  - Users should be able to export their data themselves
    - Pretty much is just the user snap but without uid
- Could split server.js into multiple files for easier code management
