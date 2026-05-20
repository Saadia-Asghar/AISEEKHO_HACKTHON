/** Injects Vercel/CI env into the Expo bundle at build time. */
const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || '',
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    },
  },
};
