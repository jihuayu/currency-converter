export type ChannelId = 'visa' | 'mastercard';
export type CurrencyCode = string;
export type RegionCode = string;
export type PackageId = string;

export interface SuccessfulRateResult {
  provider: ChannelId;
  status: 'success';
  currency: CurrencyCode;
  rate: number;
  sampleAmount: number;
  convertedAmount: number;
  sourceUpdatedAt: string | null;
  requestUrl: string;
}

export interface FailedRateResult {
  provider: ChannelId;
  status: 'error';
  currency: CurrencyCode;
  message: string;
  requestUrl: string;
  httpStatus?: number;
}

export type ProviderRateResult = SuccessfulRateResult | FailedRateResult;

export type CurrencyRateMap = Record<
  CurrencyCode,
  Partial<Record<ChannelId, ProviderRateResult>>
>;

export interface AppStorePriceRegion {
  code: RegionCode;
  name: string;
  currency: CurrencyCode;
  symbol: string;
  flag: string;
}

export interface AppStorePackagePrice {
  amount: number;
  currency: CurrencyCode;
  region: RegionCode;
  regionName: string;
  amountCny?: number;
}

export interface AppStorePricePackage {
  id: PackageId;
  name: string;
  prices: Record<RegionCode, AppStorePackagePrice>;
  description: string;
  pricingNote: string;
  sourceSkuName?: string;
  duration?: string | null;
}

export interface AppStorePricesResponse {
  appId: string;
  appName: string;
  sourceUrl: string;
  fetchedAt: string;
  regions: AppStorePriceRegion[];
  packages: AppStorePricePackage[];
  notes: string[];
}

export interface ExchangeRatesResponse {
  baseCurrency: 'CNY';
  sampleAmount: number;
  fetchedAt: string;
  currencies: CurrencyRateMap;
  appStorePrices?: AppStorePricesResponse;
  notes: string[];
}

export const RATE_SAMPLE_AMOUNT = 1000;

export function isSuccessRate(
  value: ProviderRateResult | undefined
): value is SuccessfulRateResult {
  return value?.status === 'success';
}
