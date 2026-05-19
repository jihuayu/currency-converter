'use client';

import { useMemo } from 'react';
import {
  channels,
  formatPrice,
  getPackageLocalPrice,
  type ChannelId,
  type CurrencyInfo,
  type PackageId,
  type RegionCode,
  type SubscriptionPackage,
} from '@/lib/data';
import {
  isSuccessRate,
  type CurrencyCode,
  type ExchangeRatesResponse,
  type ProviderRateResult,
} from '@/lib/exchange-rate-types';
import { cn } from '@/lib/utils';
import { CreditCard, Minus, TrendingDown, TrendingUp } from 'lucide-react';

function billingSuffix(duration: string | null | undefined): string {
  switch (duration) {
    case 'monthly':
      return '/月';
    case 'yearly':
      return '/年';
    case 'weekly':
      return '/周';
    default:
      return '/次';
  }
}

interface PriceTableProps {
  exchangeRates: ExchangeRatesResponse;
  availableRegions: readonly CurrencyInfo[];
  availablePackages: readonly SubscriptionPackage[];
  selectedCurrencies: RegionCode[];
  selectedChannels: ChannelId[];
  selectedPackages: PackageId[];
}

export function PriceTable({
  exchangeRates,
  availableRegions,
  availablePackages,
  selectedCurrencies,
  selectedChannels,
  selectedPackages,
}: PriceTableProps) {
  const filteredPackages = useMemo(
    () => availablePackages.filter((item) => selectedPackages.includes(item.id)),
    [availablePackages, selectedPackages]
  );
  const filteredRegions = useMemo(
    () => availableRegions.filter((item) => selectedCurrencies.includes(item.code)),
    [availableRegions, selectedCurrencies]
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
    pkg: SubscriptionPackage
  ): { region: RegionCode; channel: ChannelId; price: number } | null => {
    let lowest: {
      region: RegionCode;
      channel: ChannelId;
      price: number;
    } | null = null;

    for (const region of filteredRegions) {
      const localPrice = getPackageLocalPrice(pkg, region.code);
      if (localPrice === null) {
        continue;
      }

      for (const channel of filteredChannels) {
        const price = getCNYPrice(localPrice.amount, localPrice.currency, channel.id);
        if (price === null) {
          continue;
        }

        if (!lowest || price < lowest.price) {
          lowest = { region: region.code, channel: channel.id, price };
        }
      }
    }

    return lowest;
  };

  const getBasePrice = (pkg: SubscriptionPackage): number | null => {
    const usPrice = getPackageLocalPrice(pkg, 'US');
    if (usPrice === null) {
      return null;
    }

    const usPrices = filteredChannels
      .map((channel) => getCNYPrice(usPrice.amount, usPrice.currency, channel.id))
      .filter((price): price is number => price !== null);

    if (usPrices.length === 0) {
      return null;
    }

    return Math.min(...usPrices);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {filteredPackages.map((pkg) => {
          const lowest = getLowestPrice(pkg);
          const basePrice = getBasePrice(pkg);
          const usPrice = getPackageLocalPrice(pkg, 'US');
          const packageRegions = filteredRegions.filter(
            (region) => getPackageLocalPrice(pkg, region.code) !== null
          );

          return (
            <div
              key={pkg.id}
              id={pkg.id}
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-border/90 bg-card/95 shadow-lg shadow-brand-navy/5 md:scroll-mt-28"
            >
              <div className="border-b border-border/80 bg-gradient-to-r from-brand-blue/10 via-secondary/60 to-primary/10 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-brand-navy">
                      <a
                        href={`#${pkg.id}`}
                        className="inline-flex items-center gap-2 transition-colors hover:text-brand-blue"
                      >
                        <span>{pkg.name}</span>
                        <span className="text-sm text-muted-foreground" aria-hidden="true">
                          #
                        </span>
                      </a>
                    </h3>
                  </div>
                  {usPrice !== null && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">美区参考价</div>
                      <div className="font-mono font-semibold text-brand-navy">
                        {formatPrice(usPrice.amount, usPrice.currency)}
                        <span className="text-muted-foreground font-normal">
                          {billingSuffix(pkg.duration)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {packageRegions.map((region) => {
                    const listedPrice = getPackageLocalPrice(pkg, region.code);

                    return (
                      <div
                        key={region.code}
                        className="rounded-2xl border border-border/70 bg-white/75 p-4 shadow-sm shadow-brand-navy/5"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">{region.flag}</span>
                          <span className="font-semibold text-brand-navy">
                            {region.name}
                          </span>
                          <span className="text-sm text-muted-foreground ml-auto font-mono">
                            {listedPrice !== null
                              ? formatPrice(listedPrice.amount, listedPrice.currency)
                              : '无当地价'}
                          </span>
                        </div>

                        {listedPrice === null ? (
                          <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 text-sm text-muted-foreground">
                            暂未配置该地区 Apple App Store 订阅价
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filteredChannels.map((channel) => {
                              const result = getRateResult(listedPrice.currency, channel.id);
                              const price = getCNYPrice(
                                listedPrice.amount,
                                listedPrice.currency,
                                channel.id
                              );
                              const isLowest =
                                lowest?.region === region.code &&
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
                                region.code !== 'US' &&
                                price !== null &&
                                savings !== null &&
                                savingsPercent !== null &&
                                Math.abs(savingsPercent) > 0.05;
                              const showBaseline = region.code === 'US' && price !== null;

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

              {lowest && packageRegions.length > 1 && (
                <div className="border-t border-border/80 bg-gradient-to-r from-soft-green to-white px-6 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">最优方案</span>
                    <span className="text-sm font-medium text-primary">
                      {availableRegions.find((item) => item.code === lowest.region)?.name}{' '}
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
