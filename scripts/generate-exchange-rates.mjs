import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const APPSTORE_PRICE_APPS = [
  {
    appStoreId: '6448311069',
    label: 'ChatGPT',
    url: 'https://appstoreprice.org/zh/apps/6448311069',
  },
  {
    appStoreId: '6473753684',
    label: 'Claude',
    url: 'https://appstoreprice.org/zh/apps/6473753684',
  },
  {
    appStoreId: '333903271',
    label: 'X',
    url: 'https://appstoreprice.org/zh/apps/333903271',
  },
];

const SAMPLE_AMOUNT = 1000;
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'exchange-rates.json');
const VISA_CALCULATOR_URL =
  'https://www.visa.com.hk/support/consumer/travel-support/exchange-rate-calculator.html';
const DESKTOP_CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';


const DISPLAY_SKU_IDS = new Set([
  'chatgpt-oai-chatgpt-plus-1999-1m',
  'chatgpt-oai-chatgpt-pro-20000-1m',
  'claude-com-anthropic-claude-max-20250402-20x-monthly-ios',
  'chatgpt-oai-chatgpt-pro-10000-1m',
  'claude-com-anthropic-claude-pro-monthly-ios',
  'claude-com-anthropic-claude-max-20250402-5x-monthly-ios',
  'x-com-twitter-apple-rogue-one-2-1',
  'x-com-twitter-apple-premium-plus',
]);

const DISPLAY_SKU_ORDER = new Map(
  Array.from(DISPLAY_SKU_IDS, (id, index) => [id, index])
);

const CURRENCY_SYMBOLS = {
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

function formatVisaDate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function buildVisaUrl(currency, amount, date = new Date()) {
  const params = new URLSearchParams({
    amount: String(amount),
    fee: '0',
    utcConvertedDate: formatVisaDate(date),
    exchangedate: formatVisaDate(date),
    fromCurr: 'CNY',
    toCurr: currency,
  });

  return `https://www.visa.com.hk/cmsapi/fx/rates?${params.toString()}`;
}

function buildMastercardUrl(currency, amount) {
  const params = new URLSearchParams({
    exchange_date: '0000-00-00',
    transaction_currency: currency,
    cardholder_billing_currency: 'CNY',
    bank_fee: '0',
    transaction_amount: String(amount),
  });

  return `https://www.mastercard.com/marketingservices/public/mccom-services/currency-conversions/conversion-rates?${params.toString()}`;
}

function unixSecondsToIso(value) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

function getChromeExecutablePath() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);

  const matched = candidates.find((candidate) => existsSync(candidate));
  if (!matched) {
    throw new Error(
      '未找到可用的 Chrome/Chromium，可通过 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH 指定浏览器路径。'
    );
  }
  return matched;
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sku';
}

function cleanDurationFromName(name, duration) {
  if (!duration) return name;
  const patterns = {
    monthly: [/\s*[\(（-]\s*monthly\s*[\)）]?\s*$/i],
    yearly: [/\s*[\(（-]\s*(annual|yearly)\s*[\)）]?\s*$/i],
    weekly: [/\s*[\(（-]\s*weekly\s*[\)）]?\s*$/i],
  }[duration] ?? [];
  return patterns.reduce((value, pattern) => value.replace(pattern, '').trim(), name);
}

function durationLabel(duration) {
  switch (duration) {
    case 'monthly':
      return '月付';
    case 'yearly':
      return '年付';
    case 'weekly':
      return '周付';
    case 'lifetime':
      return '永久';
    case 'half_yearly':
      return '半年付';
    default:
      return null;
  }
}

function countryFlag(regionCode) {
  if (!/^[A-Z]{2}$/.test(regionCode)) return '🏳️';
  return regionCode
    .split('')
    .map((char) => String.fromCodePoint(char.charCodeAt(0) - 65 + 0x1f1e6))
    .join('');
}

function extractEscapedJsonArray(html, needle, fromIndex = 0) {
  const needleIndex = html.indexOf(needle, fromIndex);
  if (needleIndex === -1) {
    throw new Error(`未找到 ${needle}`);
  }

  const start = needleIndex + needle.length - 1;
  let level = 0;
  let end = -1;

  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (char === '[') {
      level += 1;
    } else if (char === ']') {
      level -= 1;
      if (level === 0) {
        end = index + 1;
        break;
      }
    }
  }

  if (end === -1) {
    throw new Error(`未能解析 ${needle}`);
  }

  const escapedJson = html.slice(start, end);
  return JSON.parse(escapedJson.replace(/\\"/g, '"').replace(/\\\//g, '/'));
}

function normalizePrice(price) {
  return {
    region: price.region,
    regionName: price.regionName || price.region,
    currency: price.currency,
    amount: Number(price.price),
    amountCny: Number.isFinite(Number(price.priceCny))
      ? Number(price.priceCny)
      : undefined,
  };
}

function selectUsAndCheapestPrices(prices) {
  const normalizedPrices = prices
    .map(normalizePrice)
    .filter((price) => price.region && price.currency && Number.isFinite(price.amount));
  const usPrice = normalizedPrices.find((price) => price.region === 'US');
  const cheapest = normalizedPrices
    .filter((price) => price.region !== 'US')
    .filter((price) => Number.isFinite(price.amountCny))
    .sort((a, b) => a.amountCny - b.amountCny)
    .slice(0, 2);

  const selected = [];
  if (usPrice) selected.push(usPrice);
  for (const price of cheapest) {
    if (!selected.some((item) => item.region === price.region)) {
      selected.push(price);
    }
  }

  return selected;
}

async function fetchAppStorePriceApp(app) {
  const response = await fetch(app.url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'User-Agent': DESKTOP_CHROME_UA,
    },
  });

  if (!response.ok) {
    throw new Error(`${app.label} App Store Price 页面返回 ${response.status}`);
  }

  const html = await response.text();
  const appIndex = html.indexOf(`\\"appStoreId\\":\\"${app.appStoreId}\\"`);
  const subscriptions = extractEscapedJsonArray(
    html,
    '\\"subscriptions\\":[',
    appIndex === -1 ? 0 : appIndex
  );

  return subscriptions
    .filter((subscription) => Array.isArray(subscription.prices) && subscription.prices.length > 0)
    .map((subscription, index) => {
      const selectedPrices = selectUsAndCheapestPrices(subscription.prices);
      const duration = durationLabel(subscription.duration);
      const skuName = cleanDurationFromName(
        subscription.nameZh || subscription.name,
        subscription.duration
      );
      const displayName = duration ? `${skuName}（${duration}）` : skuName;
      const packageName = displayName
        .toLowerCase()
        .startsWith(app.label.toLowerCase())
        ? displayName
        : `${app.label} ${displayName}`;

      return {
        id: `${slugify(app.label)}-${slugify(subscription.subscriptionId || subscription.id || `${subscription.name}-${index}`)}`,
        name: packageName,
        prices: Object.fromEntries(
          selectedPrices.map((price) => [
            price.region,
            {
              amount: price.amount,
              currency: price.currency,
              region: price.region,
              regionName: price.regionName,
              amountCny: price.amountCny,
            },
          ])
        ),
        description: `${app.label} App Store 内购 SKU`,
        pricingNote: 'App Store Price 构建时抓取：美区 + 按人民币换算最便宜的 2 个地区',
        sourceSkuName: subscription.name,
        duration: subscription.duration ?? null,
      };
    })
    .filter((pkg) => Object.keys(pkg.prices).length > 0);
}

async function fetchAppStorePrices() {
  const packageGroups = await Promise.all(APPSTORE_PRICE_APPS.map(fetchAppStorePriceApp));
  const packages = packageGroups
    .flat()
    .filter((pkg) => DISPLAY_SKU_IDS.has(pkg.id))
    .sort((a, b) => DISPLAY_SKU_ORDER.get(a.id) - DISPLAY_SKU_ORDER.get(b.id));
  const regionMap = new Map();

  for (const pkg of packages) {
    for (const price of Object.values(pkg.prices)) {
      if (!regionMap.has(price.region)) {
        regionMap.set(price.region, {
          code: price.region,
          name: price.regionName,
          currency: price.currency,
          symbol: CURRENCY_SYMBOLS[price.currency] ?? `${price.currency} `,
          flag: countryFlag(price.region),
        });
      }
    }
  }

  return {
    appId: APPSTORE_PRICE_APPS.map((app) => app.appStoreId).join(','),
    appName: APPSTORE_PRICE_APPS.map((app) => app.label).join(', '),
    sourceUrl: APPSTORE_PRICE_APPS.map((app) => app.url).join(', '),
    fetchedAt: new Date().toISOString(),
    regions: Array.from(regionMap.values()).sort((a, b) => {
      if (a.code === 'US') return -1;
      if (b.code === 'US') return 1;
      return a.name.localeCompare(b.name, 'zh-CN');
    }),
    packages,
    notes: [
      '价格数据来自 appstoreprice.org 的公开页面。',
      '每个 SKU 只保留美区以及按 appstoreprice.org 人民币换算价排序最便宜的 2 个地区。',
    ],
  };
}

function getManualRate(currency, provider) {
  if (currency !== 'CNY') return null;
  return {
    provider,
    status: 'success',
    currency,
    rate: 1,
    sampleAmount: SAMPLE_AMOUNT,
    convertedAmount: SAMPLE_AMOUNT,
    sourceUpdatedAt: new Date().toISOString(),
    requestUrl: 'manual://CNY',
  };
}

async function fetchMastercardRates(currencyCodes) {
  const entries = await Promise.all(
    currencyCodes.map(async (currency) => {
      const manualRate = getManualRate(currency, 'mastercard');
      if (manualRate) return [currency, manualRate];

      const requestUrl = buildMastercardUrl(currency, SAMPLE_AMOUNT);
      try {
        const response = await fetch(requestUrl, {
          headers: {
            Accept: 'application/json, text/plain, */*',
          },
        });

        if (!response.ok) {
          throw new Error(`接口返回 ${response.status}`);
        }

        const payload = await response.json();
        const rate = Number(payload.data?.conversionRate);
        if (!Number.isFinite(rate)) {
          throw new Error('接口未返回有效 conversionRate');
        }

        return [
          currency,
          {
            provider: 'mastercard',
            status: 'success',
            currency,
            rate,
            sampleAmount: SAMPLE_AMOUNT,
            convertedAmount: Number(payload.data?.crdhldBillAmt),
            sourceUpdatedAt: payload.data?.fxDate
              ? new Date(`${payload.data.fxDate}T00:00:00Z`).toISOString()
              : null,
            requestUrl,
          },
        ];
      } catch (error) {
        return [
          currency,
          {
            provider: 'mastercard',
            status: 'error',
            currency,
            message: error instanceof Error ? error.message : String(error),
            requestUrl,
          },
        ];
      }
    })
  );

  return Object.fromEntries(entries);
}

async function fetchVisaRates(currencyCodes) {
  const browser = await chromium.launch({
    executablePath: getChromeExecutablePath(),
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  try {
    const context = await browser.newContext({
      userAgent: DESKTOP_CHROME_UA,
      locale: 'en-US',
      timezoneId: 'Asia/Shanghai',
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
      },
    });

    try {
      const page = await context.newPage();
      await page.goto(VISA_CALCULATOR_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const results = await page.evaluate(
        async ({ currencies, amount }) => {
          const formatDate = () => {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const year = now.getFullYear();
            return `${month}/${day}/${year}`;
          };

          const buildUrl = (currency) => {
            const params = new URLSearchParams({
              amount: String(amount),
              fee: '0',
              utcConvertedDate: formatDate(),
              exchangedate: formatDate(),
              fromCurr: 'CNY',
              toCurr: currency,
            });
            return `https://www.visa.com.hk/cmsapi/fx/rates?${params.toString()}`;
          };

          const output = {};
          for (const currency of currencies) {
            if (currency === 'CNY') {
              output[currency] = {
                provider: 'visa',
                status: 'success',
                currency,
                rate: 1,
                sampleAmount: amount,
                convertedAmount: amount,
                sourceUpdatedAt: new Date().toISOString(),
                requestUrl: 'manual://CNY',
              };
              continue;
            }

            const requestUrl = buildUrl(currency);
            try {
              const response = await fetch(requestUrl, { credentials: 'include' });
              if (!response.ok) {
                throw new Error(`接口返回 ${response.status}`);
              }
              const payload = await response.json();
              const rate = Number(payload.originalValues?.fxRateVisa);
              if (!Number.isFinite(rate)) {
                throw new Error('接口未返回有效 fxRateVisa');
              }
              output[currency] = {
                provider: 'visa',
                status: 'success',
                currency,
                rate,
                sampleAmount: amount,
                convertedAmount: Number(payload.originalValues?.toAmountWithVisaRate),
                sourceUpdatedAt: payload.originalValues?.lastUpdatedVisaRate ?? null,
                requestUrl,
              };
            } catch (error) {
              output[currency] = {
                provider: 'visa',
                status: 'error',
                currency,
                message: error instanceof Error ? error.message : String(error),
                requestUrl,
              };
            }
          }
          return output;
        },
        { currencies: currencyCodes, amount: SAMPLE_AMOUNT }
      );

      for (const currency of currencyCodes) {
        if (results[currency]?.status === 'success' && results[currency].requestUrl !== 'manual://CNY') {
          results[currency].sourceUpdatedAt = unixSecondsToIso(
            results[currency].sourceUpdatedAt
          );
        }
      }

      await page.close();
      return results;
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

function getCurrencyCodes(appStorePrices) {
  return Array.from(
    new Set(
      appStorePrices.packages.flatMap((pkg) =>
        Object.values(pkg.prices).map((price) => price.currency)
      )
    )
  ).sort((a, b) => {
    if (a === 'USD') return -1;
    if (b === 'USD') return 1;
    return a.localeCompare(b);
  });
}

async function main() {
  const appStorePrices = await fetchAppStorePrices();
  const currencyCodes = getCurrencyCodes(appStorePrices);
  console.log(`App Store Price SKUs: ${appStorePrices.packages.length}`);
  console.log(`Currencies: ${currencyCodes.join(', ')}`);

  const [visa, mastercard] = await Promise.all([
    fetchVisaRates(currencyCodes),
    fetchMastercardRates(currencyCodes),
  ]);

  const payload = {
    baseCurrency: 'CNY',
    sampleAmount: SAMPLE_AMOUNT,
    fetchedAt: new Date().toISOString(),
    currencies: Object.fromEntries(
      currencyCodes.map((currency) => [
        currency,
        {
          visa: visa[currency],
          mastercard: mastercard[currency],
        },
      ])
    ),
    appStorePrices,
    notes: [
      '该文件在构建阶段生成，属于静态汇率与 App Store Price 价格快照。',
      'Visa 使用 Chromium + 桌面 UA，在官方汇率页面同站上下文内抓取。',
      'Mastercard 使用官方公开汇率接口抓取。',
      'SKU 价格来自 appstoreprice.org；每个 SKU 保留美区 + 最便宜的 2 个地区。',
    ],
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Generated ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
