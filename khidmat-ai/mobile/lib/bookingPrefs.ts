import AsyncStorage from '@react-native-async-storage/async-storage';

export type PriceSort = 'smart' | 'low' | 'high';

const KEY = 'price_sort_pref';

export async function getPriceSort(): Promise<PriceSort> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v === 'low' || v === 'high' || v === 'smart') return v;
  } catch {
    /* ignore */
  }
  return 'smart';
}

export async function setPriceSort(sort: PriceSort) {
  await AsyncStorage.setItem(KEY, sort);
}
