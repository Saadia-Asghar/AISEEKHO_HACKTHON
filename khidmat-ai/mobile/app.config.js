/** Injects Vercel/CI env into the Expo bundle at build time. */
const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      // On Vercel, web uses same-origin /api (edge AI). Do not bake Render URL into the bundle.
      apiUrl:
        process.env.VERCEL === '1' || process.env.VERCEL === 'true'
          ? ''
          : process.env.EXPO_PUBLIC_API_URL || '',
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    },
  },
};
