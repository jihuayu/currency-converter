'use client';

import { useEffect, useMemo, useState } from 'react';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { FilterBar } from '@/components/filter-bar';
import { MobileSubscriptionSwitcher } from '@/components/mobile-subscription-switcher';
import {
  channels,
  currencies,
  isDefaultPackageSelection,
  packages,
  type ChannelId,
  type CurrencyCode,
  type PackageId,
} from '@/lib/data';

interface MobileControlsDrawerProps {
  selectedCurrencies: CurrencyCode[];
  selectedChannels: ChannelId[];
  selectedPackages: PackageId[];
  onFilterChange: (
    currencies: CurrencyCode[],
    channels: ChannelId[],
    packages: PackageId[]
  ) => void;
  onPackageChange: (packages: PackageId[]) => void;
}

export function MobileControlsDrawer({
  selectedCurrencies,
  selectedChannels,
  selectedPackages,
  onFilterChange,
  onPackageChange,
}: MobileControlsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasFilters =
    selectedCurrencies.length < currencies.length ||
    selectedChannels.length < channels.length ||
    !isDefaultPackageSelection(selectedPackages);

  const packageLabel = useMemo(() => {
    if (selectedPackages.length === 1) {
      return packages.find((pkg) => pkg.id === selectedPackages[0])?.name ?? '选择订阅';
    }

    if (isDefaultPackageSelection(selectedPackages)) {
      return '默认订阅';
    }

    if (selectedPackages.length === packages.length) {
      return '全部订阅';
    }

    return `${selectedPackages.length} 个订阅`;
  }, [selectedPackages]);

  const filterLabel = hasFilters
    ? `${selectedCurrencies.length}/${currencies.length} 货币 · ${selectedChannels.length}/${channels.length} 渠道`
    : '未筛选';

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <div className="sticky top-3 z-30 mb-4">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 text-left shadow-2xl shadow-background/40 backdrop-blur transition-colors hover:bg-white"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">快速切换 / 筛选</span>
              <span className="block truncate font-medium text-foreground">
                {packageLabel}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {filterLabel}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-brand-navy">
            <Filter className="h-3.5 w-3.5" />
            打开
          </span>
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-brand-navy/45 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-controls-title"
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            aria-label="关闭筛选抽屉"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden rounded-t-[1.75rem] border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 id="mobile-controls-title" className="text-lg font-bold text-brand-navy">
                  快速切换与筛选
                </h2>
                <p className="text-sm text-muted-foreground">
                  将订阅切换、货币和支付渠道统一放在这里
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-brand-blue"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(88vh-8.5rem)] space-y-6 overflow-y-auto px-5 py-5">
              <MobileSubscriptionSwitcher
                variant="inline"
                selectedPackages={selectedPackages}
                onPackageChange={onPackageChange}
              />
              <FilterBar
                variant="plain"
                collapsible={false}
                selectedCurrencies={selectedCurrencies}
                selectedChannels={selectedChannels}
                selectedPackages={selectedPackages}
                onFilterChange={onFilterChange}
              />
            </div>

            <div className="border-t border-border bg-card px-5 py-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
