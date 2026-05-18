import { ConverterClient } from '@/components/converter-client';
import exchangeRates from '@/public/exchange-rates.json';
import type { ExchangeRatesResponse } from '@/lib/exchange-rate-types';

export default function Home() {
  return (
    <ConverterClient exchangeRates={exchangeRates as unknown as ExchangeRatesResponse} />
  );
}
