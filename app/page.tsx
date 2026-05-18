"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback } from "react";
import { FilterBar } from "@/components/filter-bar";
import { PriceTable } from "@/components/price-table";
import { Header } from "@/components/header";
import { currencies, channels, packages } from "@/lib/data";
import type { CurrencyCode, ChannelId, PackageId } from "@/lib/data";

function ConverterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 从 URL 获取筛选参数
  const selectedCurrencies = (
    searchParams.get("currencies")?.split(",") || currencies.map((c) => c.code)
  ).filter((c) => currencies.some((cur) => cur.code === c)) as CurrencyCode[];

  const selectedChannels = (
    searchParams.get("channels")?.split(",") || channels.map((c) => c.id)
  ).filter((c) => channels.some((ch) => ch.id === c)) as ChannelId[];

  const selectedPackages = (
    searchParams.get("packages")?.split(",") || packages.map((p) => p.id)
  ).filter((p) => packages.some((pkg) => pkg.id === p)) as PackageId[];

  // 更新 URL 参数
  const updateFilters = useCallback(
    (
      newCurrencies: CurrencyCode[],
      newChannels: ChannelId[],
      newPackages: PackageId[]
    ) => {
      const params = new URLSearchParams();
      if (
        newCurrencies.length > 0 &&
        newCurrencies.length < currencies.length
      ) {
        params.set("currencies", newCurrencies.join(","));
      }
      if (newChannels.length > 0 && newChannels.length < channels.length) {
        params.set("channels", newChannels.join(","));
      }
      if (newPackages.length > 0 && newPackages.length < packages.length) {
        params.set("packages", newPackages.join(","));
      }
      const queryString = params.toString();
      router.push(queryString ? `?${queryString}` : "/", { scroll: false });
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <FilterBar
          selectedCurrencies={selectedCurrencies}
          selectedChannels={selectedChannels}
          selectedPackages={selectedPackages}
          onFilterChange={updateFilters}
        />
        <PriceTable
          selectedCurrencies={selectedCurrencies}
          selectedChannels={selectedChannels}
          selectedPackages={selectedPackages}
        />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      }
    >
      <ConverterContent />
    </Suspense>
  );
}
