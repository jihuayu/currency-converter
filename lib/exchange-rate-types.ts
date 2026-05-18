import type { ChannelId, CurrencyCode } from '@/lib/data';

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

export interface ExchangeRatesResponse {
  baseCurrency: 'CNY';
  sampleAmount: number;
  fetchedAt: string;
  currencies: CurrencyRateMap;
  notes: string[];
}

export const RATE_SAMPLE_AMOUNT = 1000;

export function isSuccessRate(
  value: ProviderRateResult | undefined
): value is SuccessfulRateResult {
  return value?.status === 'success';
}
