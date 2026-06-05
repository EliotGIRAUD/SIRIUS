export type UserPlan = 'free' | 'premium';

export type B2CProductId = 'pdf_report' | 'breed_unlock';

export type B2BPlanId = 'spa_launch' | 'breeder_launch' | 'sponsor_starter' | 'sponsor_standard' | 'sponsor_premium' | 'sponsor_exclusive';

export interface PurchaseRecord {
  type: 'b2c' | 'b2b';
  productId: string;
  purchasedAt: string;
  mock: boolean;
  amountEur?: number;
}

export interface PaymentProvider {
  purchase(productId: string): Promise<PurchaseResult>;
  subscribe(planId: string): Promise<SubscriptionResult>;
}

export interface PurchaseResult {
  success: boolean;
  productId: string;
  mock: boolean;
}

export interface SubscriptionResult {
  success: boolean;
  planId: string;
  validUntil: string;
  mock: boolean;
}

export const B2C_PRODUCTS: Record<B2CProductId, { label: string; priceEur: number }> = {
  pdf_report: { label: 'Rapport PDF + Attestation', priceEur: 4.99 },
  breed_unlock: { label: 'Déblocage nouvelle race', priceEur: 2.99 },
};

export const B2B_PLANS: Record<string, { label: string; priceEur: number; impressions?: number }> = {
  spa_launch: { label: 'Refuge SPA', priceEur: 99 },
  breeder_launch: { label: 'Éleveur', priceEur: 129 },
  sponsor_starter: { label: 'Sponsoring Starter', priceEur: 99, impressions: 5000 },
  sponsor_standard: { label: 'Sponsoring Standard', priceEur: 249, impressions: 15000 },
  sponsor_premium: { label: 'Sponsoring Premium', priceEur: 699, impressions: 50000 },
  sponsor_exclusive: { label: 'Sponsoring Exclusif', priceEur: 1499, impressions: 150000 },
};

export const FREE_BREED_ID = 'labrador';

export function hasProduct(purchases: PurchaseRecord[] = [], productId: string): boolean {
  return purchases.some((p) => p.productId === productId);
}

export class MockPaymentProvider implements PaymentProvider {
  async purchase(productId: string): Promise<PurchaseResult> {
    return { success: true, productId, mock: true };
  }

  async subscribe(planId: string): Promise<SubscriptionResult> {
    const until = new Date();
    until.setMonth(until.getMonth() + 1);
    return { success: true, planId, validUntil: until.toISOString(), mock: true };
  }
}
