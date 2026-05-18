'use client';

import { useMemo } from 'react';
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
import { CreditCard, Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface PriceTableProps {
  exchangeRates: ExchangeRatesResponse;
  selectedCurrencies: CurrencyCode[];
  selectedChannels: ChannelId[];
  selectedPackages: PackageId[];
}

export function PriceTable({
  exchangeRates,
  selectedCurrencies,
  selectedChannels,
  selectedPackages,
}: PriceTableProps) {
  const filteredPackages = useMemo(
    () => packages.filter((item) => selectedPackages.includes(item.id)),
    [selectedPackages]
  );
  const filteredCurrencies = useMemo(
    () => currencies.filter((item) => selectedCurrencies.includes(item.code)),
    [selectedCurrencies]
  );
  const filteredChannels = useMemo(
    () => channels.filter((item) => selectedChannels.includes(item.id)),
    [selectedChannels]
  );

  const rateLookup = exchangeRates.currencies;

  const getRateResult = (
    currencyCode: CurrencyCode,
    channelId: ChannelId
  ): ProviderRateResult | undefined => rateLookup[currencyCode]?.[channelId];

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
    <div className="space-y-4">
      <div className="grid gap-4">
        {filteredPackages.map((pkg) => {
          const lowest = getLowestPrice(pkg);
          const basePrice = getBasePrice(pkg);
          const usdAmount = getPackageLocalPrice(pkg, 'USD');

          return (
            <div
              key={pkg.id}
              className="overflow-hidden rounded-2xl border border-border/90 bg-card/95 shadow-lg shadow-brand-navy/5"
            >
              <div className="border-b border-border/80 bg-gradient-to-r from-brand-blue/10 via-secondary/60 to-primary/10 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-brand-navy">
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
                      <div className="font-mono font-semibold text-brand-navy">
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
                        className="rounded-2xl border border-border/70 bg-white/75 p-4 shadow-sm shadow-brand-navy/5"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">{currency.flag}</span>
                          <span className="font-semibold text-brand-navy">
                            {currency.name}
                          </span>
                          <span className="text-sm text-muted-foreground ml-auto font-mono">
                            {listedAmount !== null
                              ? formatPrice(listedAmount, currency.code)
                              : '无当地价'}
                          </span>
                        </div>

                        {listedAmount === null ? (
                          <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 text-sm text-muted-foreground">
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
                              const showSavings =
                                currency.code !== 'USD' &&
                                price !== null &&
                                savings !== null &&
                                savingsPercent !== null &&
                                Math.abs(savingsPercent) > 0.05;
                              const showBaseline =
                                currency.code === 'USD' && price !== null;

                              return (
                                <div
                                  key={channel.id}
                                  className={cn(
                                    'rounded-lg p-3 transition-all',
                                    'flex min-h-[88px] flex-col justify-between',
                                    isLowest
                                      ? 'border border-primary/35 bg-soft-green shadow-sm shadow-primary/10'
                                      : 'border border-transparent bg-background/70'
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="h-4 w-4 text-brand-blue" />
                                      <span className="text-sm text-muted-foreground">
                                        {channel.name}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      {price !== null ? (
                                        <div
                                          className={cn(
                                            'font-mono font-semibold',
                                            isLowest ? 'text-primary' : 'text-brand-navy'
                                          )}
                                        >
                                          {formatPrice(price)}
                                        </div>
                                      ) : (
                                        <div className="text-sm text-amber-700">不可用</div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-2 min-h-4">
                                    {showSavings && (
                                      <div
                                        className={cn(
                                          'flex items-center gap-1 text-xs',
                                          savings > 0 ? 'text-primary' : 'text-red-500'
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

                                    {showBaseline && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Minus className="w-3 h-3" />
                                        <span>基准数据</span>
                                      </div>
                                    )}
                                  </div>

                                  {!isSuccessRate(result) && result && (
                                    <p className="mt-2 text-xs leading-5 text-amber-700">
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
                <div className="border-t border-border/80 bg-gradient-to-r from-soft-green to-white px-6 py-3">
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
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-lg shadow-brand-navy/5">
          <p className="text-muted-foreground">请选择至少一个套餐</p>
        </div>
      )}
    </div>
  );
}
