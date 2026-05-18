import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'hazir_search_history';
const MAX = 5;

export async function getSearchHistory(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function addSearch(query: string) {
  const q = query.trim();
  if (!q) return;
  let list = await getSearchHistory();
  list = [q, ...list.filter((x) => x !== q)].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}
