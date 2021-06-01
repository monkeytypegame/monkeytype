# Mongo todo

## Todo

- Create a script to pull all data from monkeytype and move it to the new mongo server

## Bugs

- Creating the first tag shows error "Unknown error, cannot read property \_id of undefined"
- Check for tag pb doesn't always work
  - error probably in checkIfTagPB method in server.js
- Leaderboard doesn't show the time until the daily reset
- lbmemory is not edited by mongo/express so it leaderboard doesn't show change in placement like it's supposed to
- Graph bugs out when new result is added but page is not refreshed
  - Graph loops back from earliest point to the new points
  - Results list isn't updated either
- Save config doesn't actually return data?
- Leaderboard says glb is undefined on first item

### Minor/efficiency bugs

- Does clearDailyLeaderboards cause a memory leak?
- Is filteredResults.reverse(); in account.js going to cause efficiency issues?
  - For loop in account could work backwards instead, but this would add complexity
- Why does `if (page == "account") pageTransition = false;` get rid of endless account loading bug when accessing via url

### Possibilities

- Might be worthwhile to use redis to store userdata up to a certain point
  - Users who have been requested in the last hour will be stored in the redis database so that their data can be sent again without having to search a large database
    - After an hour without a new request they can be removed from memory
- Create a backup system to prevent loss of data
  - Users should be able to export their data themselves
