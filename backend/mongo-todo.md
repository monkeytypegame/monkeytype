# Mongo todo

## Todo

- Create a script to pull all data from monkeytype and move it to the new mongo server

## Bugs

- Leaderboard doesn't show the time until the daily reset
- lbmemory is not edited by mongo/express so it leaderboard doesn't show change in placement like it's supposed to
- Graph bugs out when new result is added but page is not refreshed
  - Graph loops back from earliest point to the new points
  - Results list isn't updated either
- Save config doesn't actually return data?
- Leaderboard says glb is undefined on first item
- Account button sometimes shows loading after new pr is set
  - Can't navigate to user until page is refreshed
  - After refresh, pr is not saved
- Some methods in functions/index.js may be broken
  - I think bot commands like lbUpdate and such

### Minor/efficiency bugs

- Does clearDailyLeaderboards cause a memory leak?
- Is filteredResults.reverse(); in account.js going to cause efficiency issues?
  - For loop in account could work backwards instead, but this would add complexity
- Why does `if (page == "account") pageTransition = false;` get rid of endless account loading bug when accessing via url
- Name is not passed in user token/auth().currentUser
- Firestore read operations seem high
  - Does this include index.html serving as well as user authentication or is there more?

### Possibilities

- Might be worthwhile to use redis to store userdata up to a certain point
  - Users who have been requested in the last hour will be stored in the redis database so that their data can be sent again without having to search a large database
    - After an hour without a new request they can be removed from memory
- Create a backup system to prevent loss of data
  - Users should be able to export their data themselves
