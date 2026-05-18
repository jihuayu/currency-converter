'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  channels,
  currencies,
  formatPrice,
  getPackageLocalPrice,
  packages,
  type ChannelId,
  type CurrencyCode,
  type PackageId,
} from '@/lib/data';
import {
  isSuccessRate,
  type ExchangeRatesResponse,
  type ProviderRateResult,
} from '@/lib/exchange-rate-types';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  CreditCard,
  LoaderCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface PriceTableProps {
  selectedCurrencies: CurrencyCode[];
  selectedChannels: ChannelId[];
  selectedPackages: PackageId[];
}

function formatDateTime(value: string | null): string {
  if (!value) return '未知';

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
}

export function PriceTable({
  selectedCurrencies,
  selectedChannels,
  selectedPackages,
}: PriceTableProps) {
  const filteredPackages = packages.filter((item) =>
    selectedPackages.includes(item.id)
  );
  const filteredCurrencies = currencies.filter((item) =>
    selectedCurrencies.includes(item.code)
  );
  const filteredChannels = channels.filter((item) =>
    selectedChannels.includes(item.id)
  );

  const [rates, setRates] = useState<ExchangeRatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRates() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/exchange-rates.json', {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`接口请求失败：${response.status}`);
        }

        const payload = (await response.json()) as ExchangeRatesResponse;
        const filteredPayload: ExchangeRatesResponse = {
          ...payload,
          currencies: Object.fromEntries(
            selectedCurrencies.map((currencyCode) => [
              currencyCode,
              payload.currencies[currencyCode],
            ])
          ) as ExchangeRatesResponse['currencies'],
        };
        setRates(filteredPayload);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          fetchError instanceof Error ? fetchError.message : '汇率获取失败'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadRates();

    return () => controller.abort();
  }, [selectedCurrencies]);

  const rateLookup = useMemo(() => rates?.currencies, [rates]);

  const getRateResult = (
    currencyCode: CurrencyCode,
    channelId: ChannelId
  ): ProviderRateResult | undefined => rateLookup?.[currencyCode]?.[channelId];

  const getCNYPrice = (
    amount: number,
    currencyCode: CurrencyCode,
    channelId: ChannelId
  ): number | null => {
    const result = getRateResult(currencyCode, channelId);
    if (!isSuccessRate(result)) {
      return null;
    }

    return Number((amount * result.rate).toFixed(2));
  };

  const getLowestPrice = (
    pkg: (typeof packages)[number]
  ): { currency: CurrencyCode; channel: ChannelId; price: number } | null => {
    let lowest: {
      currency: CurrencyCode;
      channel: ChannelId;
      price: number;
    } | null = null;

    for (const currency of filteredCurrencies) {
      const localPrice = getPackageLocalPrice(pkg, currency.code);
      if (localPrice === null) {
        continue;
      }

      for (const channel of filteredChannels) {
        const price = getCNYPrice(localPrice, currency.code, channel.id);
        if (price === null) {
          continue;
        }

        if (!lowest || price < lowest.price) {
          lowest = { currency: currency.code, channel: channel.id, price };
        }
      }
    }

    return lowest;
  };

  const getBasePrice = (pkg: (typeof packages)[number]): number | null => {
    const usdAmount = getPackageLocalPrice(pkg, 'USD');
    if (usdAmount === null) {
      return null;
    }

    const usdPrices = filteredChannels
      .map((channel) => getCNYPrice(usdAmount, 'USD', channel.id))
      .filter((price): price is number => price !== null);

    if (usdPrices.length === 0) {
      return null;
    }

    return Math.min(...usdPrices);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              实时汇率（兑人民币）
            </h3>
            <p className="text-sm text-muted-foreground">
              页面读取构建时生成的静态汇率快照，适合纯 SSG 部署。
            </p>
          </div>
          {loading && (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="w-4 h-4 animate-spin" />
              加载中...
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCurrencies.map((currency) => (
            <div
              key={currency.code}
              className="rounded-xl border border-border bg-secondary/20 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{currency.flag}</span>
                <div>
                  <div className="font-medium text-foreground">{currency.name}</div>
                  <div className="text-xs text-muted-foreground">
                    1 {currency.code} ≈ CNY
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {filteredChannels.map((channel) => {
                  const result = getRateResult(currency.code, channel.id);
                  const success = isSuccessRate(result);

                  return (
                    <div
                      key={channel.id}
                      className="rounded-lg bg-background/70 px-3 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-foreground">
                            {channel.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {success
                              ? `更新时间：${formatDateTime(result.sourceUpdatedAt)}`
                              : '当前不可用'}
                          </div>
                        </div>
                        <div className="text-right">
                          {success ? (
                            <div className="font-mono font-semibold text-foreground">
                              ¥{result.rate.toFixed(6)}
                            </div>
                          ) : (
                            <div className="text-sm text-amber-300">不可用</div>
                          )}
                        </div>
                      </div>

                      {!success && result && (
                        <p className="mt-2 text-xs leading-5 text-amber-200/90">
                          {result.message}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {rates?.notes?.length ? (
          <div className="space-y-1 text-xs text-muted-foreground">
            {rates.notes.map((note) => (
              <div key={note}>• {note}</div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4">
        {filteredPackages.map((pkg) => {
          const lowest = getLowestPrice(pkg);
          const basePrice = getBasePrice(pkg);
          const usdAmount = getPackageLocalPrice(pkg, 'USD');

          return (
            <div
              key={pkg.id}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="bg-secondary/30 px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {pkg.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {pkg.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pkg.pricingNote}
                    </p>
                  </div>
                  {usdAmount !== null && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">美区参考价</div>
                      <div className="font-mono font-semibold text-foreground">
                        {formatPrice(usdAmount, 'USD')}
                        <span className="text-muted-foreground font-normal">
                          /月
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCurrencies.map((currency) => {
                    const listedAmount = getPackageLocalPrice(pkg, currency.code);

                    return (
                      <div
                        key={currency.code}
                        className="bg-secondary/20 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">{currency.flag}</span>
                          <span className="font-medium text-foreground">
                            {currency.name}
                          </span>
                          <span className="text-sm text-muted-foreground ml-auto font-mono">
                            {listedAmount !== null
                              ? formatPrice(listedAmount, currency.code)
                              : '无当地价'}
                          </span>
                        </div>

                        {listedAmount === null ? (
                          <div className="rounded-lg bg-background/50 px-3 py-3 text-sm text-muted-foreground">
                            暂未配置该地区 Apple App Store 订阅价
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filteredChannels.map((channel) => {
                              const result = getRateResult(currency.code, channel.id);
                              const price = getCNYPrice(
                                listedAmount,
                                currency.code,
                                channel.id
                              );
                              const isLowest =
                                lowest?.currency === currency.code &&
                                lowest?.channel === channel.id;
                              const savings =
                                typeof basePrice === 'number' && typeof price === 'number'
                                  ? basePrice - price
                                  : null;
                              const savingsPercent =
                                typeof savings === 'number' && basePrice
                                  ? (savings / basePrice) * 100
                                  : null;

                              return (
                                <div
                                  key={channel.id}
                                  className={cn(
                                    'p-3 rounded-lg transition-all',
                                    isLowest
                                      ? 'bg-primary/10 border border-primary/30'
                                      : 'bg-background/50'
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm text-muted-foreground">
                                        {channel.name}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      {price !== null ? (
                                        <div
                                          className={cn(
                                            'font-mono font-semibold',
                                            isLowest ? 'text-primary' : 'text-foreground'
                                          )}
                                        >
                                          {formatPrice(price)}
                                        </div>
                                      ) : (
                                        <div className="text-sm text-amber-300">不可用</div>
                                      )}
                                    </div>
                                  </div>

                                  {currency.code !== 'USD' &&
                                    price !== null &&
                                    savings !== null &&
                                    savingsPercent !== null &&
                                    Math.abs(savingsPercent) > 0.05 && (
                                      <div
                                        className={cn(
                                          'mt-2 flex items-center gap-1 text-xs',
                                          savings > 0 ? 'text-primary' : 'text-red-400'
                                        )}
                                      >
                                        {savings > 0 ? (
                                          <TrendingDown className="w-3 h-3" />
                                        ) : (
                                          <TrendingUp className="w-3 h-3" />
                                        )}
                                        <span>
                                          {savings > 0 ? '省' : '贵'}{' '}
                                          {Math.abs(savingsPercent).toFixed(1)}%
                                        </span>
                                      </div>
                                    )}

                                  {!isSuccessRate(result) && result && (
                                    <p className="mt-2 text-xs leading-5 text-amber-200/90">
                                      {result.message}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {lowest && filteredCurrencies.length > 1 && (
                <div className="bg-primary/5 px-6 py-3 border-t border-border">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">最优方案</span>
                    <span className="text-sm font-medium text-primary">
                      {currencies.find((item) => item.code === lowest.currency)?.name}{' '}
                      + {channels.find((item) => item.id === lowest.channel)?.name}
                      <span className="ml-2 font-mono">
                        {formatPrice(lowest.price)}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredPackages.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">请选择至少一个套餐</p>
        </div>
      )}
    </div>
  );
}
