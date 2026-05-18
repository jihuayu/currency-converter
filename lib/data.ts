// 汇率数据 - 实际使用时可以替换为实时 API
export const exchangeRates = {
  USD: 7.24, // 美元兑人民币
  TRY: 0.21, // 土耳其里拉兑人民币
  NGN: 0.0045, // 尼日利亚奈拉兑人民币
};

// 支付渠道手续费
export const channelFees = {
  visa: 0.015, // 1.5% 手续费
  mastercard: 0.018, // 1.8% 手续费
};

// 货币信息
export const currencies = [
  { code: "USD", name: "美元", symbol: "$", flag: "🇺🇸" },
  { code: "TRY", name: "土耳其里拉", symbol: "₺", flag: "🇹🇷" },
  { code: "NGN", name: "尼日利亚奈拉", symbol: "₦", flag: "🇳🇬" },
] as const;

// 支付渠道
export const channels = [
  { id: "visa", name: "Visa", fee: "1.5%" },
  { id: "mastercard", name: "Mastercard", fee: "1.8%" },
] as const;

// 预设套餐
export const packages = [
  { id: "custom-100", name: "100 单位", amount: 100, description: "自定义金额" },
  {
    id: "chatgpt-plus",
    name: "ChatGPT Plus",
    amount: 20,
    currency: "USD",
    description: "OpenAI ChatGPT Plus 订阅",
  },
  {
    id: "chatgpt-pro",
    name: "ChatGPT Pro",
    amount: 200,
    currency: "USD",
    description: "OpenAI ChatGPT Pro 订阅",
  },
  {
    id: "claude-pro",
    name: "Claude Pro",
    amount: 20,
    currency: "USD",
    description: "Anthropic Claude Pro 订阅",
  },
  {
    id: "claude-max",
    name: "Claude Max",
    amount: 100,
    currency: "USD",
    description: "Anthropic Claude Max 订阅",
  },
  {
    id: "cursor-pro",
    name: "Cursor Pro",
    amount: 20,
    currency: "USD",
    description: "Cursor Pro 订阅",
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    amount: 10,
    currency: "USD",
    description: "GitHub Copilot 订阅",
  },
] as const;

export type CurrencyCode = (typeof currencies)[number]["code"];
export type ChannelId = (typeof channels)[number]["id"];
export type PackageId = (typeof packages)[number]["id"];

// 计算人民币价格
export function calculateCNYPrice(
  amount: number,
  currencyCode: CurrencyCode,
  channelId: ChannelId
): number {
  const rate = exchangeRates[currencyCode];
  const fee = channelFees[channelId];
  const basePrice = amount * rate;
  const totalPrice = basePrice * (1 + fee);
  return Math.round(totalPrice * 100) / 100;
}

// 格式化价格
export function formatPrice(price: number, currency: string = "CNY"): string {
  if (currency === "CNY") {
    return `¥${price.toFixed(2)}`;
  }
  const currencyInfo = currencies.find((c) => c.code === currency);
  return `${currencyInfo?.symbol || ""}${price.toFixed(2)}`;
}
