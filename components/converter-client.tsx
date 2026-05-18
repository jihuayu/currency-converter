'use client';

import { useCallback, useEffect, useState } from 'react';
import { FilterBar } from '@/components/filter-bar';
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
import type { ExchangeRatesResponse } from '@/lib/exchange-rate-types';

interface ConverterClientProps {
  exchangeRates: ExchangeRatesResponse;
}

export function ConverterClient({ exchangeRates }: ConverterClientProps) {
  const [filters, setFilters] = useState<FilterState>(getDefaultFilterState);

  useEffect(() => {
    const syncFiltersFromLocation = () => {
      setFilters(parseFilterState(window.location.search));
    };

    syncFiltersFromLocation();
    window.addEventListener('popstate', syncFiltersFromLocation);

    return () => {
      window.removeEventListener('popstate', syncFiltersFromLocation);
    };
  }, []);

  const updateFilters = useCallback((nextFilters: FilterState) => {
    setFilters(nextFilters);

    const nextUrl = buildFilterSearch(nextFilters);
    window.history.replaceState(window.history.state, '', nextUrl);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute left-[-10rem] top-20 h-80 w-80 rounded-full bg-brand-blue/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-44 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <Header />
      <main className="container relative z-10 mx-auto max-w-7xl px-4 py-8">
        <ProjectIntroCard fetchedAt={exchangeRates.fetchedAt} />
        <FilterBar
          className="hidden md:block"
          selectedCurrencies={filters.currencies}
          selectedChannels={filters.channels}
          selectedPackages={filters.packages}
          onFilterChange={(currencies, channels, packages) =>
            updateFilters({ currencies, channels, packages })
          }
        />
        <MobileControlsDrawer
          selectedCurrencies={filters.currencies}
          selectedChannels={filters.channels}
          selectedPackages={filters.packages}
          onFilterChange={(currencies, channels, packages) =>
            updateFilters({ currencies, channels, packages })
          }
          onPackageChange={(nextPackages) =>
            updateFilters({ ...filters, packages: nextPackages })
          }
        />
        <PriceTable
          exchangeRates={exchangeRates}
          selectedCurrencies={filters.currencies}
          selectedChannels={filters.channels}
          selectedPackages={filters.packages}
        />
      </main>
    </div>
  );
}
