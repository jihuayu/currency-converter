'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PriceTable } from '@/components/price-table';
import { Header } from '@/components/header';
import { ProjectIntroCard } from '@/components/project-intro-card';
import { MobileControlsDrawer } from '@/components/mobile-controls-drawer';
import {
  buildFilterSearch,
  getDefaultFilterState,
  parseFilterState,
  type FilterState,
} from '@/lib/filter-state';
import {
  getPackagesFromExchangeRates,
  getRegionsFromExchangeRates,
} from '@/lib/data';
import type { ExchangeRatesResponse } from '@/lib/exchange-rate-types';

interface ConverterClientProps {
  exchangeRates: ExchangeRatesResponse;
}

export function ConverterClient({ exchangeRates }: ConverterClientProps) {
  const availableRegions = useMemo(
    () => getRegionsFromExchangeRates(exchangeRates),
    [exchangeRates]
  );
  const availablePackages = useMemo(
    () => getPackagesFromExchangeRates(exchangeRates),
    [exchangeRates]
  );

  const [filters, setFilters] = useState<FilterState>(() =>
    getDefaultFilterState(availableRegions, availablePackages)
  );

  useEffect(() => {
    const syncFiltersFromLocation = () => {
      setFilters(
        parseFilterState(
          window.location.search,
          availableRegions,
          availablePackages
        )
      );
    };

    syncFiltersFromLocation();
    window.addEventListener('popstate', syncFiltersFromLocation);

    return () => {
      window.removeEventListener('popstate', syncFiltersFromLocation);
    };
  }, [availablePackages, availableRegions]);

  const updateFilters = useCallback(
    (nextFilters: FilterState) => {
      setFilters(nextFilters);

      const nextUrl = buildFilterSearch(
        nextFilters,
        availableRegions,
        availablePackages
      );
      window.history.replaceState(window.history.state, '', nextUrl);
    },
    [availablePackages, availableRegions]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute left-[-10rem] top-20 h-80 w-80 rounded-full bg-brand-blue/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-44 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <Header />
      <main className="container relative z-10 mx-auto max-w-7xl px-4 py-8">
        <ProjectIntroCard fetchedAt={exchangeRates.fetchedAt} />
        <MobileControlsDrawer
          availablePackages={availablePackages}
          selectedPackages={filters.packages}
          onPackageChange={(nextPackages) =>
            updateFilters({ ...filters, packages: nextPackages })
          }
        />
        <PriceTable
          exchangeRates={exchangeRates}
          availableRegions={availableRegions}
          availablePackages={availablePackages}
          selectedCurrencies={filters.currencies}
          selectedChannels={filters.channels}
          selectedPackages={filters.packages}
        />
      </main>
    </div>
  );
}
