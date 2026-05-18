"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  currencies,
  channels,
  defaultPackageIds,
  isDefaultPackageSelection,
  packages,
  type CurrencyCode,
  type ChannelId,
  type PackageId,
} from "@/lib/data";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";

interface FilterBarProps {
  selectedCurrencies: CurrencyCode[];
  selectedChannels: ChannelId[];
  selectedPackages: PackageId[];
  className?: string;
  collapsible?: boolean;
  variant?: "card" | "plain";
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
  className,
  collapsible = true,
  variant = "card",
  onFilterChange,
}: FilterBarProps) {
  const panelId = useId();
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const showPanel = !collapsible || isExpanded;
  const hasDefaultPackages = isDefaultPackageSelection(selectedPackages);

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
      defaultPackageIds
    );
  };

  const hasFilters =
    selectedCurrencies.length < currencies.length ||
    selectedChannels.length < channels.length ||
    !hasDefaultPackages;

  const summaryText = useMemo(() => {
    if (!hasFilters) {
      return null;
    }

    return `已筛选 ${selectedCurrencies.length}/${currencies.length} 个货币、${selectedChannels.length}/${channels.length} 个渠道、${selectedPackages.length}/${packages.length} 个套餐`;
  }, [hasFilters, selectedCurrencies.length, selectedChannels.length, selectedPackages.length]);

  return (
    <div
      className={cn(
        variant === "card"
          ? "mb-6 rounded-2xl border border-border/90 bg-card/90 p-6 shadow-lg shadow-brand-navy/5 backdrop-blur-sm"
          : "mb-0 rounded-none border-0 bg-transparent p-0 shadow-none",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => collapsible && setIsExpanded((prev) => !prev)}
          className={cn(
            "flex items-center justify-between gap-3 text-left text-brand-navy",
            collapsible && "transition-colors hover:text-brand-blue"
          )}
          aria-expanded={showPanel}
          aria-controls={panelId}
          disabled={!collapsible}
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-brand-blue" />
            <span className="font-medium">筛选条件</span>
          </span>
          {collapsible && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{isExpanded ? "收起" : "展开"}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 sm:justify-end">
          {summaryText && (
            <p className="text-sm text-muted-foreground">{summaryText}</p>
          )}
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-brand-blue"
            >
              <X className="w-3 h-3" />
              重置
            </button>
          )}
        </div>
      </div>

      {showPanel && (
        <div id={panelId} className="space-y-4 pt-4">
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
                    "rounded-xl border px-3 py-1.5 text-sm font-medium transition-all",
                    selectedCurrencies.includes(currency.code)
                      ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "border-border/80 bg-secondary/70 text-secondary-foreground hover:border-brand-blue/30 hover:bg-white"
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
                    "rounded-xl border px-3 py-1.5 text-sm font-medium transition-all",
                    selectedChannels.includes(channel.id)
                      ? "border-brand-blue bg-brand-blue text-white shadow-sm shadow-brand-blue/20"
                      : "border-border/80 bg-secondary/70 text-secondary-foreground hover:border-brand-blue/30 hover:bg-white"
                  )}
                >
                  {channel.name}
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
                    "rounded-xl border px-3 py-1.5 text-sm font-medium transition-all",
                    selectedPackages.includes(pkg.id)
                      ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "border-border/80 bg-secondary/70 text-secondary-foreground hover:border-brand-blue/30 hover:bg-white"
                  )}
                >
                  {pkg.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
