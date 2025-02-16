# Use an official Node.js runtime as a parent image.
FROM node:18-alpine

# Install Java (OpenJDK 11) required for Firebase emulators.
RUN apk add --no-cache openjdk11

# Set the working directory in the container.
WORKDIR /usr/src/app

# Install the Firebase CLI globally.
RUN npm install -g firebase-tools

# Copy the project files to the container.
COPY firebase-emulator/firebase.json .

# Pre-download Firebase emulators to avoid downloading at runtime
RUN firebase setup:emulators:ui

# Expose the ports used by your emulators.
EXPOSE 9099 4000

# Start the Firebase emulators (host settings should be in firebase.json).
CMD ["firebase", "emulators:start",  "--project", "local-project", "--import", "/usr/src/app/emulator-data/data", "--export-on-exit"]

