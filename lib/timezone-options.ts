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
