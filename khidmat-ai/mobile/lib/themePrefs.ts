import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'khidmat_color_scheme';

export type ColorScheme = 'light' | 'dark';

export async function getColorScheme(): Promise<ColorScheme> {
  const v = await AsyncStorage.getItem(THEME_KEY);
  return v === 'light' ? 'light' : 'dark';
}

export async function setColorScheme(scheme: ColorScheme) {
  await AsyncStorage.setItem(THEME_KEY, scheme);
}
