import {
  channels,
  getDefaultPackageIds,
  isDefaultPackageSelection,
  type ChannelId,
  type CurrencyInfo,
  type PackageId,
  type RegionCode,
  type SubscriptionPackage,
} from '@/lib/data';

export interface FilterState {
  currencies: RegionCode[];
  channels: ChannelId[];
  packages: PackageId[];
}

const allChannelIds = channels.map((item) => item.id) as ChannelId[];

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function getRegionCodes(availableRegions: readonly CurrencyInfo[]): RegionCode[] {
  return availableRegions.map((item) => item.code);
}

export function getDefaultFilterState(
  availableRegions: readonly CurrencyInfo[],
  availablePackages: readonly SubscriptionPackage[]
): FilterState {
  return {
    currencies: getRegionCodes(availableRegions),
    channels: [...allChannelIds],
    packages: getDefaultPackageIds(availablePackages),
  };
}

export function parseFilterState(
  input: string | URLSearchParams | null | undefined,
  availableRegions: readonly CurrencyInfo[],
  availablePackages: readonly SubscriptionPackage[]
): FilterState {
  const params =
    typeof input === 'string'
      ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input)
      : input ?? new URLSearchParams();

  const allRegionCodes = getRegionCodes(availableRegions);
  const defaultPackageIds = getDefaultPackageIds(availablePackages);

  const selectedCurrencies = unique(
    (params.get('currencies')?.split(',') || allRegionCodes).filter((code) =>
      availableRegions.some((item) => item.code === code)
    ) as RegionCode[]
  );

  const selectedChannels = unique(
    (params.get('channels')?.split(',') || allChannelIds).filter((id) =>
      channels.some((item) => item.id === id)
    ) as ChannelId[]
  );

  const selectedPackages = unique(
    (params.get('packages')?.split(',') || defaultPackageIds).filter((id) =>
      availablePackages.some((item) => item.id === id)
    ) as PackageId[]
  );

  return {
    currencies:
      selectedCurrencies.length > 0 ? selectedCurrencies : [...allRegionCodes],
    channels: selectedChannels.length > 0 ? selectedChannels : [...allChannelIds],
    packages:
      selectedPackages.length > 0 ? selectedPackages : [...defaultPackageIds],
  };
}

export function buildFilterSearch(
  filters: FilterState,
  availableRegions: readonly CurrencyInfo[],
  availablePackages: readonly SubscriptionPackage[]
): string {
  const params = new URLSearchParams();

  if (
    filters.currencies.length > 0 &&
    filters.currencies.length < availableRegions.length
  ) {
    params.set('currencies', filters.currencies.join(','));
  }

  if (filters.channels.length > 0 && filters.channels.length < channels.length) {
    params.set('channels', filters.channels.join(','));
  }

  if (
    filters.packages.length > 0 &&
    !isDefaultPackageSelection(filters.packages, availablePackages)
  ) {
    params.set('packages', filters.packages.join(','));
  }

  const query = params.toString();
  return query ? `?${query}` : '/';
}
