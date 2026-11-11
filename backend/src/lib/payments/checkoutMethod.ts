export const CHECKOUT_METHODS = ['DOMESTIC', 'OVERSEAS_CARD', 'OVERSEAS_EASY_PAY'] as const;
export type CheckoutMethod = typeof CHECKOUT_METHODS[number];

export function parseCheckoutMethod(value: unknown): CheckoutMethod | null {
  if (value === undefined || value === null) return 'OVERSEAS_CARD';
  return CHECKOUT_METHODS.includes(value as CheckoutMethod) ? value as CheckoutMethod : null;
}

export function isValidUsdKrwRate(rate: unknown): rate is number {
  return typeof rate === 'number' && Number.isInteger(rate) && rate >= 100 && rate <= 10000;
}

export function convertUsdCentsToKrw(cents: number, rate: number): number {
  if (!Number.isSafeInteger(cents) || cents < 0 || !isValidUsdKrwRate(rate)) {
    throw new Error('DOMESTIC_KRW_RATE_NOT_CONFIGURED');
  }
  return Math.floor((cents * rate + 50) / 100);
}

const ISO_COUNTRIES = new Set(('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' '));

export function parsePaymentCountry(value: unknown): string | null {
  const country = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return ISO_COUNTRIES.has(country) ? country : null;
}
