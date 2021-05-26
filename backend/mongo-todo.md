## Todo

- Get google login working
- Transfer leaderboard and other cloud functions
- spinning wheel on account page should dissapear after data is loaded
- Account data should be updated when new result is added/test completed
- Add email verification
- Joined date doesn't look the same as it did before
- Personal bests items should not be arrays
  - should be objects that are set on new pb
- Move user data to localstorage instead of cookies
- Result is duplicated in analytics
  - Does entire result need to be stored in analytics
  - Should result be stored in seperate collection and then referenced in user doc and analytics?
- Fix localhost, production, development server detection
  - Should be a setting in the .env
  - Maybe it could be set through package.json
    - When a specific script is run, a certain mode will be activated
- Tests started and completed doesn't increment when quitting a running test
  - Doesn't work as I expected in live version either, no issue
- Create configSchema
- Figure out if filteredResults.reverse(); in account.js is going to cause efficiency issues
  - Could reverse processing of results, but that would add more complexity to code

### leaderboard

- Add boardcleartime
  - How will boards be cleared?
    - Can there be a function that runs outside of requests
      - Wait until desired time with setTimeout and then set next timeout
- Identify bugs
- Username not highlighted and added to the bottom if current user made the leaderboard

## After beta is ready

- make sure refresh token won't expire
  - make refresh token expire after session if don't remeber me is set?
- Keep jwt and refresh in cookies?

- Get somebody else to check over security due to my lack of expertise
- Work on transfering data from firebase to mongo
- Make sure that development can be done on mac and windows computers as well
  - directories in server.js might cause issues
- Create admin panel or public stats page to make use of analytics data

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
