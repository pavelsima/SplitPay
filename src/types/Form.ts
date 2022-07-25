
interface Payer {
  name: string;
  amount: number;
};

interface FormData extends Record<string, any> {
  currency: string;
  country: string;
  payers?: Payer[];
  isSPAYD: boolean;
  isSEPA: boolean;
  isPayPal: boolean;
  paymentName: string;
  prefix?: string;
  mainNumber?: string;
  bankCode?: string;
  totalBill?: number;
  totalBillEur?: string;
  BIC?: string;
  IBAN?: string;
  email?: string;
  shortId?: string;
  doNotShortenUrl: boolean;
}

interface Json {
  [x: string]: any
}

type KeysOfType<T, U> = { [k in keyof T]-?: T[k] extends U ? k : never }[keyof T];

interface SelectedData extends Payer {
  iban: string;
  index: number;
  shareUrl: string;
}

export type { Payer, FormData, Json, SelectedData, KeysOfType };