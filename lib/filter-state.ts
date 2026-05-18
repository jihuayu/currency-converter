import {
  channels,
  currencies,
  defaultPackageIds,
  isDefaultPackageSelection,
  packages,
  type ChannelId,
  type CurrencyCode,
  type PackageId,
} from '@/lib/data';

export interface FilterState {
  currencies: CurrencyCode[];
  channels: ChannelId[];
  packages: PackageId[];
}

const allCurrencyCodes = currencies.map((item) => item.code) as CurrencyCode[];
const allChannelIds = channels.map((item) => item.id) as ChannelId[];

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function getDefaultFilterState(): FilterState {
  return {
    currencies: [...allCurrencyCodes],
    channels: [...allChannelIds],
    packages: [...defaultPackageIds],
  };
}

export function parseFilterState(
  input: string | URLSearchParams | null | undefined
): FilterState {
  const params =
    typeof input === 'string'
      ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input)
      : input ?? new URLSearchParams();

  const selectedCurrencies = unique(
    (params.get('currencies')?.split(',') || allCurrencyCodes).filter((code) =>
      currencies.some((item) => item.code === code)
    ) as CurrencyCode[]
  );

  const selectedChannels = unique(
    (params.get('channels')?.split(',') || allChannelIds).filter((id) =>
      channels.some((item) => item.id === id)
    ) as ChannelId[]
  );

  const selectedPackages = unique(
    (params.get('packages')?.split(',') || defaultPackageIds).filter((id) =>
      packages.some((item) => item.id === id)
    ) as PackageId[]
  );

  return {
    currencies:
      selectedCurrencies.length > 0 ? selectedCurrencies : [...allCurrencyCodes],
    channels: selectedChannels.length > 0 ? selectedChannels : [...allChannelIds],
    packages:
      selectedPackages.length > 0 ? selectedPackages : [...defaultPackageIds],
  };
}

export function buildFilterSearch(filters: FilterState): string {
  const params = new URLSearchParams();

  if (
    filters.currencies.length > 0 &&
    filters.currencies.length < currencies.length
  ) {
    params.set('currencies', filters.currencies.join(','));
  }

  if (filters.channels.length > 0 && filters.channels.length < channels.length) {
    params.set('channels', filters.channels.join(','));
  }

  if (filters.packages.length > 0 && !isDefaultPackageSelection(filters.packages)) {
    params.set('packages', filters.packages.join(','));
  }

  const query = params.toString();
  return query ? `?${query}` : '/';
}
