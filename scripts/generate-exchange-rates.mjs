import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const CURRENCY_CODES = ['USD', 'TRY', 'NGN'];
const SAMPLE_AMOUNT = 1000;
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'exchange-rates.json');
const VISA_CALCULATOR_URL =
  'https://www.visa.com.hk/support/consumer/travel-support/exchange-rate-calculator.html';
const DESKTOP_CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

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

async function fetchMastercardRates() {
  const entries = await Promise.all(
    CURRENCY_CODES.map(async (currency) => {
      const requestUrl = buildMastercardUrl(currency, SAMPLE_AMOUNT);
      const response = await fetch(requestUrl, {
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`Mastercard ${currency} 接口返回 ${response.status}`);
      }

      const payload = await response.json();
      return [
        currency,
        {
          provider: 'mastercard',
          status: 'success',
          currency,
          rate: Number(payload.data?.conversionRate),
          sampleAmount: SAMPLE_AMOUNT,
          convertedAmount: Number(payload.data?.crdhldBillAmt),
          sourceUpdatedAt: payload.data?.fxDate
            ? new Date(`${payload.data.fxDate}T00:00:00Z`).toISOString()
            : null,
          requestUrl,
        },
      ];
    })
  );

  return Object.fromEntries(entries);
}

async function fetchVisaRates() {
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
            const requestUrl = buildUrl(currency);
            const response = await fetch(requestUrl, { credentials: 'include' });
            if (!response.ok) {
              throw new Error(`Visa ${currency} 接口返回 ${response.status}`);
            }
            const payload = await response.json();
            output[currency] = {
              provider: 'visa',
              status: 'success',
              currency,
              rate: Number(payload.originalValues?.fxRateVisa),
              sampleAmount: amount,
              convertedAmount: Number(payload.originalValues?.toAmountWithVisaRate),
              sourceUpdatedAt: payload.originalValues?.lastUpdatedVisaRate ?? null,
              requestUrl,
            };
          }
          return output;
        },
        { currencies: CURRENCY_CODES, amount: SAMPLE_AMOUNT }
      );

      for (const currency of CURRENCY_CODES) {
        results[currency].sourceUpdatedAt = unixSecondsToIso(
          results[currency].sourceUpdatedAt
        );
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

async function main() {
  const [visa, mastercard] = await Promise.all([
    fetchVisaRates(),
    fetchMastercardRates(),
  ]);

  const payload = {
    baseCurrency: 'CNY',
    sampleAmount: SAMPLE_AMOUNT,
    fetchedAt: new Date().toISOString(),
    currencies: Object.fromEntries(
      CURRENCY_CODES.map((currency) => [
        currency,
        {
          visa: visa[currency],
          mastercard: mastercard[currency],
        },
      ])
    ),
    notes: [
      '该文件在构建阶段生成，属于静态汇率快照。',
      'Visa 使用 Chromium + 桌面 UA，在官方汇率页面同站上下文内抓取。',
      'Mastercard 使用官方公开汇率接口抓取。',
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
