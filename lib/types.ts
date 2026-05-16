export type NewspaperType = 'thanthi' | 'the-hindu' | 'times-of-india' | 'dhinamalar';

export type PaymentStatus = 'paid' | 'unpaid' | 'inactive';

export interface NewspaperCost {
  newspaper: NewspaperType;
  monthlyAmount: number;
}

export interface Client {
  id: string;
  name: string;
  phoneNumber: string;
  address: string;
  status: PaymentStatus;
  newspapers: NewspaperCost[];
  petrolCharges: number;
  totalAmount: number;
  prepaidAmount?: number;  // Amount paid in advance (optional)
  startDate?: string;      // ISO date string YYYY-MM-DD — used for overdue detection
  createdAt: Date;
}

export interface ShopSettings {
  upiId: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  shopName: string;
}

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  upiId: '',
  accountName: 'Chandran News Mart',
  accountNumber: '',
  ifsc: '',
  shopName: 'Chandran News Mart',
};

export const NEWSPAPER_LABELS: Record<NewspaperType, string> = {
  thanthi: 'Daily Thanthi',
  'the-hindu': 'The Hindu',
  'times-of-india': 'Times of India',
  dhinamalar: 'Dhinamalar',
};

export function calculateTotalAmount(
  newspapers: NewspaperCost[],
  petrolCharges: number
): number {
  const papersTotal = newspapers.reduce((sum, np) => sum + np.monthlyAmount, 0);
  return papersTotal + petrolCharges;
}