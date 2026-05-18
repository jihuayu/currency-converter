export const currencies = [
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸' },
  { code: 'TRY', name: '土耳其里拉', symbol: '₺', flag: '🇹🇷' },
  { code: 'NGN', name: '尼日利亚奈拉', symbol: '₦', flag: '🇳🇬' },
] as const;

export type CurrencyCode = (typeof currencies)[number]['code'];

export const channels = [
  { id: 'visa', name: 'Visa', description: 'Visa 官方汇率接口' },
  { id: 'mastercard', name: 'Mastercard', description: 'Mastercard 官方汇率接口' },
] as const;

export type ChannelId = (typeof channels)[number]['id'];

export type PackagePrices = Partial<Record<CurrencyCode, number>>;

export interface SubscriptionPackage {
  id: string;
  name: string;
  prices: PackagePrices;
  description: string;
  pricingNote: string;
}

export const packages = [
  {
    id: 'custom-100',
    name: '100 单位',
    prices: { USD: 100, TRY: 100, NGN: 100 },
    description: '按所选币种的 100 单位计算',
    pricingNote: '自定义测试金额',
  },
  {
    id: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    prices: { USD: 19.99, TRY: 499.99, NGN: 31500 },
    description: 'OpenAI ChatGPT Plus 订阅',
    pricingNote: '土区/尼区使用当地 Apple App Store 标价',
  },
  {
    id: 'chatgpt-pro',
    name: 'ChatGPT Pro 20x',
    prices: { USD: 200, TRY: 7999.99, NGN: 299900 },
    description: 'OpenAI ChatGPT Pro 20x 订阅',
    pricingNote: '土区/尼区使用当地 Apple App Store 标价',
  },
  {
    id: 'chatgpt-pro-5x',
    name: 'ChatGPT Pro 5x',
    prices: { USD: 100, TRY: 5299.99, NGN: 144900 },
    description: 'OpenAI ChatGPT Pro 5x 订阅',
    pricingNote: '土区/尼区使用当地 Apple App Store 标价',
  },
  {
    id: 'claude-pro',
    name: 'Claude Pro',
    prices: { USD: 20, TRY: 799.99, NGN: 14900 },
    description: 'Anthropic Claude Pro 订阅',
    pricingNote: '土区/尼区使用当地 Apple App Store 标价',
  },
  {
    id: 'claude-max',
    name: 'Claude Max 5x',
    prices: { USD: 124.99, TRY: 4999.99, NGN: 100000 },
    description: 'Anthropic Claude Max 5x 订阅',
    pricingNote: '土区/尼区使用当地 Apple App Store 标价',
  },
  {
    id: 'claude-max-20x',
    name: 'Claude Max 20x',
    prices: { USD: 249.99, TRY: 9999.99, NGN: 200000 },
    description: 'Anthropic Claude Max 20x 订阅',
    pricingNote: '土区/尼区使用当地 Apple App Store 标价',
  },
  {
    id: 'cursor-pro',
    name: 'Cursor Pro',
    prices: { USD: 20 },
    description: 'Cursor Pro 订阅',
    pricingNote: '暂未配置土区/尼区 Apple App Store 标价',
  },
] as const satisfies readonly SubscriptionPackage[];

export type PackageId = (typeof packages)[number]['id'];

export function formatPrice(price: number, currency: string = 'CNY'): string {
  if (currency === 'CNY') {
    return `¥${price.toFixed(2)}`;
  }

  const currencyInfo = currencies.find((item) => item.code === currency);
  return `${currencyInfo?.symbol ?? ''}${price.toFixed(2)}`;
}

export function getPackageLocalPrice(
  pkg: SubscriptionPackage,
  currencyCode: CurrencyCode
): number | null {
  return pkg.prices[currencyCode] ?? null;
}
