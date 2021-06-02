# Mongo todo

## Todo

- Create a script to pull all data from monkeytype and move it to the new mongo server

## Bugs

- Graph bugs out when new result is added but page is not refreshed
  - Graph loops back from earliest point to the new points
  - Results list isn't updated either
- Some methods in functions/index.js may be broken
  - I think bot commands like lbUpdate and such
- Leaderboard entries that should be hidden are not

### Minor/efficiency bugs

- Does clearDailyLeaderboards cause a memory leak?
- Is filteredResults.reverse(); in account.js going to cause efficiency issues?
  - For loop in account could work backwards instead, but this would add complexity
- Why does `if (page == "account") pageTransition = false;` get rid of endless account loading bug when accessing via url
- Name is not passed in user token/auth().currentUser
- Firestore read operations seem high
  - Does this include index.html serving as well as user authentication or is there more?
- Account button sometimes shows loading infinitely after a test
  - Can't navigate to user until page is refreshed
  - After refresh, pr is not saved
  - Can't induce this error and doesn't occur often so adding it as minor bug
- Does lbMemory work exactly like it did before

### Possibilities

- Might be worthwhile to use redis to store userdata up to a certain point
  - Users who have been requested in the last hour will be stored in the redis database so that their data can be sent again without having to search a large database
    - After an hour without a new request they can be removed from memory
- Create a backup system to prevent loss of data
  - Users should be able to export their data themselves
