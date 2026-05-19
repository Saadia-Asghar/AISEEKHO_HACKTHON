export type PaymentCredentialsPayload =
  | {
      kind: 'card';
      card_number: string;
      cardholder_name: string;
      expiry: string;
      cvv: string;
    }
  | { kind: 'wallet'; phone: string; pin: string }
  | { kind: 'cash'; confirmed: boolean };
