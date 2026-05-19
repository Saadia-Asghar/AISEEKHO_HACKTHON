import AsyncStorage from '@react-native-async-storage/async-storage';

export type SavedCard = {
  id: string;
  brand: 'visa' | 'mastercard';
  last4: string;
  expiry: string;
};

export type SavedWallet = {
  id: string;
  type: 'jazzcash' | 'easypaisa';
  phoneMasked: string;
};

const CARDS_KEY = 'khidmat_saved_cards';
const SELECTED_KEY = 'khidmat_payment_selected';

const DEFAULT_CARDS: SavedCard[] = [
  { id: 'visa-1', brand: 'visa', last4: '1234', expiry: '12/26' },
  { id: 'mc-1', brand: 'mastercard', last4: '5678', expiry: '08/25' },
];

const DEFAULT_WALLETS: SavedWallet[] = [
  { id: 'jc-1', type: 'jazzcash', phoneMasked: '+92 300 •••• 123' },
  { id: 'ep-1', type: 'easypaisa', phoneMasked: '+92 345 •••• 456' },
];

export async function getSavedCards(): Promise<SavedCard[]> {
  const raw = await AsyncStorage.getItem(CARDS_KEY);
  if (!raw) return DEFAULT_CARDS;
  try {
    const parsed = JSON.parse(raw) as SavedCard[];
    return parsed.length ? parsed : DEFAULT_CARDS;
  } catch {
    return DEFAULT_CARDS;
  }
}

export async function addSavedCard(card: Omit<SavedCard, 'id'>): Promise<SavedCard> {
  const cards = await getSavedCards();
  const entry: SavedCard = { ...card, id: `card-${Date.now()}` };
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify([entry, ...cards]));
  await setSelectedPaymentId(entry.id);
  return entry;
}

export async function getSavedWallets(): Promise<SavedWallet[]> {
  return DEFAULT_WALLETS;
}

export async function getSelectedPaymentId(): Promise<string> {
  return (await AsyncStorage.getItem(SELECTED_KEY)) || 'visa-1';
}

export async function setSelectedPaymentId(id: string) {
  await AsyncStorage.setItem(SELECTED_KEY, id);
}
