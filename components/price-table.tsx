"use client";

import {
  currencies,
  channels,
  packages,
  calculateCNYPrice,
  formatPrice,
  exchangeRates,
  type CurrencyCode,
  type ChannelId,
  type PackageId,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { CreditCard, TrendingDown, TrendingUp } from "lucide-react";

interface PriceTableProps {
  selectedCurrencies: CurrencyCode[];
  selectedChannels: ChannelId[];
  selectedPackages: PackageId[];
}

export function PriceTable({
  selectedCurrencies,
  selectedChannels,
  selectedPackages,
}: PriceTableProps) {
  const filteredPackages = packages.filter((p) =>
    selectedPackages.includes(p.id)
  );
  const filteredCurrencies = currencies.filter((c) =>
    selectedCurrencies.includes(c.code)
  );
  const filteredChannels = channels.filter((c) =>
    selectedChannels.includes(c.id)
  );

  // 计算每个套餐的最低价格（用于高亮）
  const getLowestPrice = (
    pkg: (typeof packages)[number]
  ): { currency: CurrencyCode; channel: ChannelId; price: number } | null => {
    let lowest: {
      currency: CurrencyCode;
      channel: ChannelId;
      price: number;
    } | null = null;

    for (const currency of filteredCurrencies) {
      const amount = pkg.currency ? pkg.amount : pkg.amount;
      for (const channel of filteredChannels) {
        const price = calculateCNYPrice(amount, currency.code, channel.id);
        if (!lowest || price < lowest.price) {
          lowest = { currency: currency.code, channel: channel.id, price };
        }
      }
    }
    return lowest;
  };

  // 计算原价（美元渠道的价格作为基准）
  const getBasePrice = (pkg: (typeof packages)[number]): number => {
    if (pkg.currency === "USD") {
      return pkg.amount * exchangeRates.USD;
    }
    return pkg.amount * exchangeRates.USD;
  };

  return (
    <div className="space-y-6">
      {/* 汇率信息 */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          当前汇率 (兑人民币)
        </h3>
        <div className="flex flex-wrap gap-4">
          {filteredCurrencies.map((currency) => (
            <div key={currency.code} className="flex items-center gap-2">
              <span className="text-lg">{currency.flag}</span>
              <span className="text-sm text-muted-foreground">
                1 {currency.code} =
              </span>
              <span className="font-mono font-medium text-foreground">
                ¥{exchangeRates[currency.code].toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 价格表格 */}
      <div className="grid gap-4">
        {filteredPackages.map((pkg) => {
          const lowest = getLowestPrice(pkg);
          const basePrice = getBasePrice(pkg);

          return (
            <div
              key={pkg.id}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              {/* 套餐头部 */}
              <div className="bg-secondary/30 px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {pkg.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {pkg.description}
                    </p>
                  </div>
                  {pkg.currency && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        原价
                      </div>
                      <div className="font-mono font-semibold text-foreground">
                        {formatPrice(pkg.amount, pkg.currency)}
                        <span className="text-muted-foreground font-normal">
                          /月
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 价格网格 */}
              <div className="p-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCurrencies.map((currency) => (
                    <div
                      key={currency.code}
                      className="bg-secondary/20 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{currency.flag}</span>
                        <span className="font-medium text-foreground">
                          {currency.name}
                        </span>
                        {!pkg.currency && (
                          <span className="text-sm text-muted-foreground ml-auto font-mono">
                            {currency.symbol}
                            {pkg.amount}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {filteredChannels.map((channel) => {
                          const price = calculateCNYPrice(
                            pkg.amount,
                            currency.code,
                            channel.id
                          );
                          const isLowest =
                            lowest?.currency === currency.code &&
                            lowest?.channel === channel.id;
                          const savings = basePrice - price;
                          const savingsPercent =
                            ((basePrice - price) / basePrice) * 100;

                          return (
                            <div
                              key={channel.id}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg transition-all",
                                isLowest
                                  ? "bg-primary/10 border border-primary/30"
                                  : "bg-background/50"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {channel.name}
                                </span>
                              </div>
                              <div className="text-right">
                                <div
                                  className={cn(
                                    "font-mono font-semibold",
                                    isLowest
                                      ? "text-primary"
                                      : "text-foreground"
                                  )}
                                >
                                  {formatPrice(price)}
                                </div>
                                {savings > 0 && pkg.currency === "USD" && (
                                  <div className="flex items-center gap-1 text-xs text-primary">
                                    <TrendingDown className="w-3 h-3" />
                                    <span>省 {savingsPercent.toFixed(1)}%</span>
                                  </div>
                                )}
                                {savings < 0 && pkg.currency === "USD" && (
                                  <div className="flex items-center gap-1 text-xs text-red-400">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>
                                      贵 {Math.abs(savingsPercent).toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 最低价提示 */}
              {lowest && filteredCurrencies.length > 1 && (
                <div className="bg-primary/5 px-6 py-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      最优方案
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {
                        currencies.find((c) => c.code === lowest.currency)
                          ?.name
                      }{" "}
                      +{" "}
                      {channels.find((c) => c.id === lowest.channel)?.name}
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

      {/* 空状态 */}
      {filteredPackages.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">请选择至少一个套餐</p>
        </div>
      )}
    </div>
  );
}
