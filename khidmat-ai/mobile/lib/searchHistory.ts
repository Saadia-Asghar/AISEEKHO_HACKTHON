import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'recent_searches';

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function addRecentSearch(q: string) {
  const trimmed = q.trim();
  if (!trimmed) return;
  const list = [trimmed, ...(await getRecentSearches()).filter((x) => x !== trimmed)].slice(0, 3);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}
