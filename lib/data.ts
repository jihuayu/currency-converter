import type {
  AppStorePricePackage,
  AppStorePriceRegion,
  ChannelId,
  CurrencyCode,
  ExchangeRatesResponse,
  PackageId,
  RegionCode,
} from '@/lib/exchange-rate-types';

export type { ChannelId, CurrencyCode, PackageId, RegionCode };

export const channels = [
  { id: 'visa', name: 'Visa', description: 'Visa 官方汇率接口' },
  { id: 'mastercard', name: 'Mastercard', description: 'Mastercard 官方汇率接口' },
] as const satisfies readonly {
  id: ChannelId;
  name: string;
  description: string;
}[];

export const fallbackRegions = [
  { code: 'US', name: '美国', currency: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'TR', name: '土耳其', currency: 'TRY', symbol: '₺', flag: '🇹🇷' },
  { code: 'NG', name: '尼日利亚', currency: 'NGN', symbol: '₦', flag: '🇳🇬' },
] as const satisfies readonly AppStorePriceRegion[];

export const currencies = fallbackRegions;
export type CurrencyInfo = AppStorePriceRegion;

export type PackagePrices = AppStorePricePackage['prices'];

export interface SubscriptionPackage extends AppStorePricePackage {}

export const fallbackPackages = [
  {
    id: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    prices: {
      US: { amount: 19.99, currency: 'USD', region: 'US', regionName: '美国' },
      TR: { amount: 499.99, currency: 'TRY', region: 'TR', regionName: '土耳其' },
      NG: { amount: 31500, currency: 'NGN', region: 'NG', regionName: '尼日利亚' },
    },
    description: 'OpenAI ChatGPT Plus 订阅',
    pricingNote: '土区/尼区使用当地 Apple App Store 标价',
  },
  {
    id: 'chatgpt-pro',
    name: 'ChatGPT Pro 20x',
    prices: {
      US: { amount: 200, currency: 'USD', region: 'US', regionName: '美国' },
      TR: { amount: 7999.99, currency: 'TRY', region: 'TR', regionName: '土耳其' },
      NG: { amount: 299900, currency: 'NGN', region: 'NG', regionName: '尼日利亚' },
    },
    description: 'OpenAI ChatGPT Pro 20x 订阅',
    pricingNote: '土区/尼区使用当地 Apple App Store 标价',
  },
] as const satisfies readonly SubscriptionPackage[];

export const packages = fallbackPackages;

const currencySymbols: Record<string, string> = {
  USD: '$',
  CNY: '¥',
  TRY: '₺',
  NGN: '₦',
  EGP: 'E£',
  INR: '₹',
  PKR: '₨',
  BRL: 'R$',
  PHP: '₱',
  HKD: 'HK$',
  TWD: 'NT$',
  JPY: '¥',
  KRW: '₩',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  MXN: 'MX$',
  RUB: '₽',
  VND: '₫',
};

export function getRegionsFromExchangeRates(
  exchangeRates: ExchangeRatesResponse
): AppStorePriceRegion[] {
  return exchangeRates.appStorePrices?.regions?.length
    ? exchangeRates.appStorePrices.regions
    : [...fallbackRegions];
}

export function getPackagesFromExchangeRates(
  exchangeRates: ExchangeRatesResponse
): SubscriptionPackage[] {
  return exchangeRates.appStorePrices?.packages?.length
    ? exchangeRates.appStorePrices.packages
    : [...fallbackPackages];
}

export function getDefaultPackageIds(
  availablePackages: readonly Pick<SubscriptionPackage, 'id'>[]
): PackageId[] {
  return availablePackages.map((pkg) => pkg.id);
}

export const defaultPackageIds = getDefaultPackageIds(packages);

export function isDefaultPackageSelection(
  packageIds: readonly PackageId[],
  availablePackages: readonly Pick<SubscriptionPackage, 'id'>[] = packages
): boolean {
  const defaults = getDefaultPackageIds(availablePackages);
  return (
    packageIds.length === defaults.length &&
    defaults.every((id) => packageIds.includes(id))
  );
}

export function formatPrice(price: number, currency: CurrencyCode = 'CNY'): string {
  if (currency === 'CNY') {
    return `¥${price.toFixed(2)}`;
  }

  const symbol = currencySymbols[currency] ?? `${currency} `;
  return `${symbol}${price.toFixed(2)}`;
}

export function getPackageLocalPrice(
  pkg: SubscriptionPackage,
  regionCode: RegionCode
): AppStorePricePackage['prices'][string] | null {
  return pkg.prices[regionCode] ?? null;
}
