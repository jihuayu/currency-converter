"use client";

import { cn } from "@/lib/utils";
import {
  currencies,
  channels,
  packages,
  type CurrencyCode,
  type ChannelId,
  type PackageId,
} from "@/lib/data";
import { Filter, X } from "lucide-react";

interface FilterBarProps {
  selectedCurrencies: CurrencyCode[];
  selectedChannels: ChannelId[];
  selectedPackages: PackageId[];
  onFilterChange: (
    currencies: CurrencyCode[],
    channels: ChannelId[],
    packages: PackageId[]
  ) => void;
}

export function FilterBar({
  selectedCurrencies,
  selectedChannels,
  selectedPackages,
  onFilterChange,
}: FilterBarProps) {
  const toggleCurrency = (code: CurrencyCode) => {
    const newCurrencies = selectedCurrencies.includes(code)
      ? selectedCurrencies.filter((c) => c !== code)
      : [...selectedCurrencies, code];
    if (newCurrencies.length > 0) {
      onFilterChange(newCurrencies, selectedChannels, selectedPackages);
    }
  };

  const toggleChannel = (id: ChannelId) => {
    const newChannels = selectedChannels.includes(id)
      ? selectedChannels.filter((c) => c !== id)
      : [...selectedChannels, id];
    if (newChannels.length > 0) {
      onFilterChange(selectedCurrencies, newChannels, selectedPackages);
    }
  };

  const togglePackage = (id: PackageId) => {
    const newPackages = selectedPackages.includes(id)
      ? selectedPackages.filter((p) => p !== id)
      : [...selectedPackages, id];
    if (newPackages.length > 0) {
      onFilterChange(selectedCurrencies, selectedChannels, newPackages);
    }
  };

  const resetFilters = () => {
    onFilterChange(
      currencies.map((c) => c.code),
      channels.map((c) => c.id),
      packages.map((p) => p.id)
    );
  };

  const hasFilters =
    selectedCurrencies.length < currencies.length ||
    selectedChannels.length < channels.length ||
    selectedPackages.length < packages.length;

  return (
    <div className="bg-card rounded-xl border border-border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-medium">筛选条件</span>
        </div>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
            重置
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* 货币筛选 */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            货币
          </label>
          <div className="flex flex-wrap gap-2">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => toggleCurrency(currency.code)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  selectedCurrencies.includes(currency.code)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                <span className="mr-1.5">{currency.flag}</span>
                {currency.name}
              </button>
            ))}
          </div>
        </div>

        {/* 渠道筛选 */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            支付渠道
          </label>
          <div className="flex flex-wrap gap-2">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => toggleChannel(channel.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  selectedChannels.includes(channel.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {channel.name}
                <span className="ml-1.5 text-xs opacity-70">
                  （接口）
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 套餐筛选 */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            套餐
          </label>
          <div className="flex flex-wrap gap-2">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => togglePackage(pkg.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  selectedPackages.includes(pkg.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {pkg.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
