import { isDSTActive } from '@/app/lib/dst-utils';

export type TimezoneOption = {
  id: string;
  offset: number;
  label: string;
  abbreviation: string;
  dst: boolean;
  region: string | null;
};

type TimezoneDefinition = readonly [
  id: string,
  offset: number,
  label: string,
  abbreviation: string,
  dst: boolean,
  region: string | null,
];

const TIMEZONE_DEFINITIONS: readonly TimezoneDefinition[] = [
  ['baker', -12, 'Baker Island', 'BIT', false, null],
  ['samoa', -11, 'American Samoa', 'SST', false, null],
  ['hawaii', -10, 'Hawaii', 'HST', false, null],
  ['alaska', -9, 'Alaska', 'AKT', true, 'us'],
  ['pacific', -8, 'Pacific Time', 'PT', true, 'us'],
  ['mountain', -7, 'Mountain Time', 'MT', true, 'us'],
  ['central', -6, 'Central Time', 'CT', true, 'us'],
  ['eastern', -5, 'Eastern Time', 'ET', true, 'us'],
  ['atlantic', -4, 'Atlantic Time', 'AT', true, 'us'],
  ['buenos-aires', -3, 'Buenos Aires', 'ART', false, null],
  ['mid-atlantic', -2, 'Mid-Atlantic', 'UTC−2', false, null],
  ['azores', -1, 'Azores', 'AZOT', true, 'eu'],
  ['utc', 0, 'Coordinated Universal Time', 'UTC', false, null],
  ['london', 0, 'London', 'UK', true, 'eu'],
  ['central-europe', 1, 'Central European', 'CET', true, 'eu'],
  ['eastern-europe', 2, 'Eastern European', 'EET', true, 'eu'],
  ['moscow', 3, 'Moscow', 'MSK', false, null],
  ['dubai', 4, 'Dubai', 'GST', false, null],
  ['pakistan', 5, 'Pakistan', 'PKT', false, null],
  ['india', 5.5, 'India', 'IST', false, null],
  ['bangladesh', 6, 'Bangladesh', 'BST', false, null],
  ['bangkok', 7, 'Bangkok', 'ICT', false, null],
  ['singapore', 8, 'Singapore', 'SGT', false, null],
  ['tokyo', 9, 'Tokyo', 'JST', false, null],
  ['sydney', 10, 'Sydney', 'AET', true, 'aus'],
  ['solomon', 11, 'Solomon Islands', 'SBT', false, null],
  ['new-zealand', 12, 'New Zealand', 'NZT', true, 'nz'],
];

const TIMEZONE_SEARCH_ALIASES: Record<string, readonly string[]> = {
  baker: ['Baker Island Time', 'Etc/GMT+12'],
  samoa: ['Pago Pago', 'Pacific/Pago_Pago', 'Samoa Standard Time'],
  hawaii: ['Honolulu', 'Hawaii-Aleutian', 'Pacific/Honolulu'],
  alaska: ['Anchorage', 'Juneau', 'Fairbanks', 'AKST', 'AKDT', 'America/Anchorage'],
  pacific: [
    'Los Angeles',
    'San Francisco',
    'Seattle',
    'Vancouver',
    'PST',
    'PDT',
    'America/Los_Angeles',
  ],
  mountain: ['Denver', 'Salt Lake City', 'Calgary', 'MST', 'MDT', 'America/Denver'],
  central: ['Chicago', 'Dallas', 'Houston', 'Winnipeg', 'CST', 'CDT', 'America/Chicago'],
  eastern: [
    'New York',
    'Toronto',
    'Washington DC',
    'Boston',
    'Miami',
    'EST',
    'EDT',
    'America/New_York',
  ],
  atlantic: ['Halifax', 'Bermuda', 'AST', 'ADT', 'America/Halifax'],
  'buenos-aires': ['Argentina', 'Buenos Aires Time', 'America/Argentina/Buenos_Aires'],
  'mid-atlantic': ['UTC-2', 'GMT-2', 'Etc/GMT+2'],
  azores: ['Ponta Delgada', 'AZOST', 'Atlantic/Azores'],
  utc: ['GMT', 'Zulu', 'Universal Time', 'Etc/UTC', 'UTC+0', 'UTC-0'],
  london: ['United Kingdom', 'England', 'GMT', 'BST', 'Europe/London'],
  'central-europe': [
    'Paris',
    'Berlin',
    'Madrid',
    'Rome',
    'Amsterdam',
    'Warsaw',
    'CEST',
    'Europe/Paris',
  ],
  'eastern-europe': ['Athens', 'Bucharest', 'Helsinki', 'Kyiv', 'EEST', 'Europe/Athens'],
  moscow: ['Russia', 'Europe/Moscow'],
  dubai: ['United Arab Emirates', 'UAE', 'Asia/Dubai'],
  pakistan: ['Karachi', 'Islamabad', 'Asia/Karachi'],
  india: ['Delhi', 'Mumbai', 'Kolkata', 'Bengaluru', 'Asia/Kolkata'],
  bangladesh: ['Dhaka', 'Asia/Dhaka'],
  bangkok: ['Thailand', 'Jakarta', 'Ho Chi Minh City', 'Asia/Bangkok'],
  singapore: ['Kuala Lumpur', 'Manila', 'Hong Kong', 'Beijing', 'Asia/Singapore'],
  tokyo: ['Japan', 'Seoul', 'Osaka', 'Asia/Tokyo'],
  sydney: ['Melbourne', 'Canberra', 'AEST', 'AEDT', 'Australia/Sydney'],
  solomon: ['Honiara', 'Pacific/Guadalcanal'],
  'new-zealand': ['Auckland', 'Wellington', 'NZST', 'NZDT', 'Pacific/Auckland'],
};

export const TIMEZONE_OPTIONS: TimezoneOption[] = TIMEZONE_DEFINITIONS.map(
  ([id, offset, label, abbreviation, dst, region]) => ({
    id,
    offset,
    label,
    abbreviation,
    dst,
    region,
  }),
);

export const UTC_OPTION = TIMEZONE_OPTIONS.find((option) => option.id === 'utc')!;
export const DEFAULT_RECENT_ZONE_IDS = ['utc', 'eastern', 'pacific'];

export function getTimezoneSearchTerms(option: TimezoneOption): readonly string[] {
  return TIMEZONE_SEARCH_ALIASES[option.id] ?? [];
}

export function getAdjustedOffset(option: TimezoneOption, canApplyDST: boolean) {
  if (!canApplyDST || !option.dst || !option.region) return option.offset;
  return isDSTActive(option.region) ? option.offset + 1 : option.offset;
}

export function formatTime(hours: number, minutes: number) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatOffset(offset: number) {
  if (offset === 0) return 'UTC±00:00';

  const totalMinutes = Math.round(Math.abs(offset) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `UTC${offset >= 0 ? '+' : '−'}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatSearchOffset(offset: number) {
  if (offset === 0) return 'UTC 0 UTC+0 UTC-0';
  return `UTC${offset >= 0 ? '+' : ''}${offset} UTC ${offset}`;
}
