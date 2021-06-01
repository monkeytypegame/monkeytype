# Todo

- Tags and leaderboard are still buggy
  - Creating the first tag shows error "Unknown error, cannot read property \_id of undefined"
  - Check for tag pb doesn't always work
  - Leaderboard doesn't show the time until the daily reset
  - User's Leaderboard history is not edited, and therefore distance moved on leaderboard does not work properly
- Account data should be updated when new result is added/test completed
- Graph bugs out when new result is added but page is not refreshed
  - Graph loops back from earliest point to the new points
  - Results list isn't updated either
- Save config doesn't actually return data?

### leaderboard

- Does clearDailyLeaderboards cause a memory leak?
  - Try commenting it out and seeing if it makes a difference
- Identify bugs
  - Leaderboard says glb is undefined on first item
    - No global or daily items are returned

## After beta is ready

- Work on transfering data from firebase to mongo
- Make sure that development can be done on mac and windows computers as well
  - directories in server.js might cause issues
- Figure out if filteredResults.reverse(); in account.js is going to cause efficiency issues
  - Could reverse processing of results, but that would add more complexity to code
- Figure out why if (page == "account") pageTransition = false; gets rid of endless account loading bug when accessing via url

## User transfer

- Create a script to pull all data from monkeytype and move it to the new mongo server
- In order to transfer users over, users should be able to be validated through firebase until they login again, when they will use their password to login. If firebase confirms that the password and email are valid, the new password will be hashed and saved to the new database
  - All data is moved and retrieved via the mongo server, just authentication uses firebase
  - Could force users to sign in again immediately in order to transfer users' passwords faster
    - Is it worth the inconvenience though.
    - Probably the best option would be to have a notification that asks users to log out and log back in again
      - Could have a set date that firebase usage will expire and users must log out and back in again before they are forcibly logged out
        - Still can't completely remove firebase dependency unless ALL users are transferred

## After release

- Investigate and improve efficiency after mongo merge or during review
- I'm not sure about this but it might be worthwhile to use redis to store userdata up to a certain point
  - Users who have been requested in the last hour will be stored in the redis database so that their data can be sent again without having to search a large database
    - After an hour without a new request they can be removed from memory
- User data should not be requested from the server every time a test is submitted, result should just be appended to results
- Create a backup system to prevent loss of data
  - Users should be able to export their data themselves
    - It's convenient because they would just have to download their user document, only one query for the server

### General noticed bugs

- Tests started and completed doesn't increment when quitting a running test
  - Doesn't work as I expected in live version either, no issue
- Personal bests items should not be arrays
  - should be objects that are set on new pb
