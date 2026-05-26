/**
 * Supported markets — country, currency, and approximate AED conversion rate.
 * Base currency for internal calculations is AED; display converts to the
 * selected market's local currency. Rates are static demo values.
 */
export type CountryCode = "eg" | "om";

export interface CountryConfig {
  code:        CountryCode;
  name:        string;
  flag:        string;        // emoji
  currency:    string;        // ISO code (EGP, OMR)
  symbol:      string;        // display symbol
  aedRate:     number;        // 1 AED = X local currency
  sources:     string[];      // market-data databases shown in pricing tab
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  eg: {
    code:     "eg",
    name:     "Egypt",
    flag:     "🇪🇬",
    currency: "EGP",
    symbol:   "EGP",
    aedRate:  13.45,
    sources: [
      "Egypt Construction Index",
      "Cairo Materials Hub",
      "EGB Building Index",
      "Alex Procurement Net",
    ],
  },
  om: {
    code:     "om",
    name:     "Oman",
    flag:     "🇴🇲",
    currency: "OMR",
    symbol:   "OMR",
    aedRate:  0.1047,
    sources: [
      "Oman Building Index",
      "Muscat Supply Hub",
      "Salalah Procurement",
      "Sohar Materials Net",
    ],
  },
};

export const COUNTRY_LIST: CountryConfig[] = Object.values(COUNTRIES);

export function convertFromAED(amountAED: number, target: CountryCode): number {
  return amountAED * COUNTRIES[target].aedRate;
}
