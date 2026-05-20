import { router } from 'expo-router';

/** Switch to Profile tab (works on web + native; avoid `/(tabs)/profile` stack bugs). */
export function goToProfileTab() {
  router.navigate('/profile');
}
