import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type InventoryUnit } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatChatTime(date = new Date()) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatPrice(n: number | null): string | null {
  if (!n) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function formatLength(length: number | null): string | null {
  if (!length) return null;
  return `${length} ft.`;
}

export function formatMileage(mileage: number | null): string | null {
  if (!mileage) return null;
  if (mileage === 0) return '0 mile';
  return `${mileage.toLocaleString('en-US')} mile${mileage === 1 ? '' : 's'}`;
}

export function formatSleeps(sleepsCount: number | null): string | null {
  if (!sleepsCount) return null;
  if (sleepsCount === 0) return '0 Sleep';
  return `${sleepsCount} Sleep${sleepsCount === 1 ? '' : 's'}`;
}

export function formatSlideouts(slideOutsCount: number | null): string | null {
  if (!slideOutsCount) return null;
  if (slideOutsCount === 0) return '0 Slideout';
  return `${slideOutsCount} Slideout${slideOutsCount === 1 ? '' : 's'}`;
}

export function rebateEndsLabel(enddate: number): string | null {
  if (!enddate) return null;
  const d = new Date(enddate * 1000);
  if (Number.isNaN(d.getTime())) return null;
  return `Rebate ends on ${d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export const bodyOptions = [
  { label: 'Class A', value: 'class-a' },
  { label: 'Class B', value: 'class-b' },
  { label: 'Class C', value: 'class-c' },
  { label: 'Travel Trailer', value: 'travel-trailer' },
  { label: 'Toy Hauler', value: 'toy-hauler' },
  { label: '5th Wheel', value: '5th-wheel' },
];

export const makeOptions = [
  { label: 'Airstream', value: 'airstream', body: ['class-b', 'class-c'] },
  {
    label: 'Brinkley RV',
    value: 'brinkley-rv',
    body: ['travel-trailer', 'toy-hauler', '5th-wheel'],
  },
  { label: 'Coachmen', value: 'coachmen', body: ['class-a', 'class-b', 'class-c'] },
  { label: 'Dynamax', value: 'dynamax', body: ['class-c'] },
  { label: 'Entegra', value: 'entegra', body: ['class-a', 'class-b', 'class-c'] },
  { label: 'Fleetwood', value: 'fleetwood', body: ['class-a', 'class-b'] },
  {
    label: 'Forest River',
    value: 'forest-river',
    body: ['class-a', 'class-c', 'travel-trailer'],
  },
  {
    label: 'Grand Design',
    value: 'grand-design',
    body: ['class-b', 'class-c', 'travel-trailer', 'toy-hauler', '5th-wheel'],
  },
  { label: 'Grech RV', value: 'grech-rv', body: ['class-b'] },
  { label: 'Heartland', value: 'heartland', body: ['5th-wheel'] },
  { label: 'Holiday Rambler', value: 'holiday-rambler', body: ['class-a'] },
  { label: 'Itasca', value: 'itasca', body: ['class-a'] },
  {
    label: 'Jayco',
    value: 'jayco',
    body: ['class-a', 'class-b', 'class-c', 'travel-trailer', 'toy-hauler', '5th-wheel'],
  },
  { label: 'Keystone', value: 'keystone', body: ['travel-trailer', '5th-wheel'] },
  { label: 'Leisure Travel Vans', value: 'leisure-travel-vans', body: ['class-b', 'class-c'] },
  { label: 'Midwest Automotive Designs', value: 'midwest-automotive-designs', body: ['class-b'] },
  { label: 'Monaco', value: 'monaco', body: [] },
  { label: 'Newmar', value: 'newmar', body: ['class-a', 'class-c'] },
  { label: 'Other Make', value: 'other-make', body: ['class-c', 'travel-trailer'] },
  { label: 'Phoenix', value: 'phoenix', body: ['class-c'] },
  { label: 'Pleasure Way', value: 'pleasure-way', body: ['class-b', 'class-c'] },
  { label: 'Regency', value: 'regency', body: ['class-c'] },
  { label: 'REV Renegade', value: 'rev-renegade', body: ['class-c'] },
  { label: 'Roadtrek', value: 'roadtrek', body: ['class-b'] },
  { label: 'Storyteller Overland', value: 'storyteller-overland', body: ['class-b', 'class-c'] },
  { label: 'Thor Motor Coach', value: 'thor-motor-coach', body: ['class-a', 'class-b', 'class-c'] },
  { label: 'Tiffin', value: 'tiffin', body: ['class-a', 'class-b', 'class-c'] },
  { label: 'Winnebago', value: 'winnebago', body: ['class-a', 'class-b', 'class-c'] },
  { label: 'Winnebago Towables', value: 'winnebago-towables', body: ['travel-trailer'] },
  { label: 'Vanleigh', value: 'vanleigh', body: [] },
];

export const modelOptions = [
  { label: 'ACCESS', value: 'access', make: 'winnebago-towables', body: ['travel-trailer'] },
  { label: 'ACCOLADE', value: 'accolade', make: 'entegra', body: ['class-c'] },
  { label: 'ACCOLADE XL', value: 'accolade-xl', make: 'entegra', body: ['class-c'] },
  { label: 'ACCOLADE XT', value: 'accolade-xt', make: 'entegra', body: ['class-c'] },
  { label: 'ACE', value: 'ace', make: 'thor-motor-coach', body: ['class-a'] },
  { label: 'ADMIRAL', value: 'admiral', make: 'holiday-rambler', body: ['class-a'] },
  { label: 'ADVENTURER', value: 'adventurer', make: 'winnebago', body: ['class-a'] },
  { label: 'ADVENTUROUS', value: 'adventurous', make: 'roadtrek', body: ['class-b'] },
  { label: 'AIRSTREAM', value: 'airstream', make: 'airstream', body: ['class-b'] },
  { label: 'ALANTE', value: 'alante', make: 'jayco', body: ['class-a'] },
  { label: 'ALANTE SE', value: 'alante-se', make: 'jayco', body: ['class-a'] },
  { label: 'ALITA', value: 'alita', make: 'forest-river', body: ['class-c'] },
  { label: 'ALLEGRO', value: 'allegro', make: 'tiffin', body: ['class-a', 'class-b'] },
  { label: 'ALLEGRO BAY', value: 'allegro-bay', make: 'tiffin', body: ['class-c'] },
  { label: 'ALLEGRO BUS', value: 'allegro-bus', make: 'tiffin', body: ['class-a'] },
  { label: 'ALLEGRO RED', value: 'allegro-red', make: 'tiffin', body: ['class-a'] },
  { label: 'ALLEGRO RED 360', value: 'allegro-red-360', make: 'tiffin', body: ['class-a'] },
  { label: 'ALPINE', value: 'alpine', make: 'keystone', body: ['5th-wheel'] },
  { label: 'AMERICAN PATRIOT', value: 'american-patriot', make: 'fleetwood', body: ['class-b'] },
  { label: 'ANTHEM', value: 'anthem', make: 'entegra', body: ['class-a'] },
  { label: 'ARC', value: 'arc', make: 'entegra', body: ['class-b'] },
  { label: 'ARIA', value: 'aria', make: 'thor-motor-coach', body: ['class-a'] },
  { label: 'ASCENT', value: 'ascent', make: 'pleasure-way', body: ['class-b'] },
  { label: 'ASPEN TRAIL', value: 'aspen-trail', make: 'keystone', body: ['travel-trailer'] },
  { label: 'ASTORIA', value: 'astoria', make: 'keystone', body: ['5th-wheel'] },
  { label: 'ATLAS', value: 'atlas', make: 'airstream', body: ['class-c'] },
  { label: 'AXIS', value: 'axis', make: 'thor-motor-coach', body: ['class-a'] },
  { label: 'BAY SAR', value: 'bay-sar', make: 'newmar', body: ['class-a'] },
  { label: 'BAY STAR', value: 'bay-star', make: 'newmar', body: ['class-a'] },
  { label: 'BAY STAR SPORT', value: 'bay-star-sport', make: 'newmar', body: ['class-a'] },
  { label: 'BAYSTAR', value: 'baystar', make: 'newmar', body: ['class-a'] },
  { label: 'BAYSTAR SPORT', value: 'baystar-sport', make: 'newmar', body: ['class-a'] },
  { label: 'BEACON', value: 'beacon', make: 'vanleigh', body: ['5th-wheel'] },
  { label: 'BEAST MODE', value: 'beast-mode', make: 'storyteller-overland', body: ['class-b'] },
  { label: 'BIG COUNTRY', value: 'big-country', make: 'heartland', body: ['5th-wheel'] },
  { label: 'BIGHORN', value: 'bighorn', make: 'heartland', body: ['5th-wheel'] },
  { label: 'BOLDT', value: 'boldt', make: 'winnebago', body: ['class-b'] },
  { label: 'BOUNDER', value: 'bounder', make: 'fleetwood', body: ['class-a'] },
  { label: 'BREEZE', value: 'breeze', make: 'tiffin', body: ['class-a'] },
  { label: 'BYWAY', value: 'byway', make: 'tiffin', body: ['class-a'] },
  { label: 'CENTURION', value: 'centurion', make: 'entegra', body: ['class-c'] },
  { label: 'CHALLLENGER', value: 'challenger', make: 'coachmen', body: ['class-a'] },
  { label: 'CHATEAU', value: 'chateau', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'CHATEAU SPRINTER', value: 'chateau-sprinter', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'COMET', value: 'comet', make: 'jayco', body: ['class-b'] },
  { label: 'COMPASS', value: 'compass', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'COMPASS AWD', value: 'compass-awd', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'COMPASS GO', value: 'compass-go', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'CONDOR', value: 'condor', make: 'entegra', body: ['class-c'] },
  { label: 'COUGAR', value: 'cougar', make: 'keystone', body: ['5th-wheel', 'travel-trailer'] },
  { label: 'CREW MODE', value: 'crew-mode', make: 'storyteller-overland', body: ['class-b'] },
  { label: 'CYCLONE', value: 'cyclone', make: 'heartland', body: ['toy-hauler'] },
  { label: 'DARK MODE', value: 'dark-mode', make: 'storyteller-overland', body: ['class-b'] },
  { label: 'DAZZLE', value: 'dazzle', make: 'thor-motor-coach', body: ['class-b'] },
  { label: 'DELANO', value: 'delano', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'DISCOVERY', value: 'discovery', make: 'fleetwood', body: ['class-a'] },
  { label: 'DISCOVERY LXE', value: 'discovery-lxe', make: 'fleetwood', body: ['class-a'] },
  { label: 'DUTCH STAR', value: 'dutch-star', make: 'newmar', body: ['class-a'] },
  { label: 'ECLIPSE', value: 'eclipse', make: 'holiday-rambler', body: ['class-a'] },
  { label: 'EDDIE BAUER', value: 'eddie-bauer', make: 'thor-motor-coach', body: ['class-b'] },
  { label: 'EKKO', value: 'ekko', make: 'winnebago', body: ['class-c'] },
  { label: 'ENCORE', value: 'encore', make: 'coachmen', body: ['class-a'] },
  { label: 'ENTRADA', value: 'entrada', make: 'forest-river', body: ['class-c'] },
  { label: 'ERA', value: 'era', make: 'winnebago', body: ['class-b'] },
  { label: 'ESSEX', value: 'essex', make: 'newmar', body: ['class-a'] },
  { label: 'ESTEEM', value: 'esteem', make: 'entegra', body: ['class-c'] },
  { label: 'ESTEEM XL', value: 'esteem-xl', make: 'entegra', body: ['class-c'] },
  { label: 'ETHOS', value: 'ethos', make: 'entegra', body: ['class-b'] },
  { label: 'EXCURSION', value: 'excursion', make: 'fleetwood', body: ['class-a'] },
  { label: 'EXPANSE', value: 'expanse', make: 'entegra', body: ['class-b'] },
  { label: 'EXPANSE LI', value: 'expanse-li', make: 'entegra', body: ['class-b'] },
  { label: 'FLAIR', value: 'flair', make: 'fleetwood', body: ['class-a'] },
  { label: 'FLEX', value: 'flex', make: 'fleetwood', body: ['class-a'] },
  { label: 'FORESTER', value: 'forester', make: 'forest-river', body: ['class-c'] },
  { label: 'FORTIS', value: 'fortis', make: 'fleetwood', body: ['class-a'] },
  { label: 'FORZA', value: 'forza', make: 'winnebago', body: ['class-a'] },
  { label: 'FOUR WINDS', value: 'four-winds', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'FR3', value: 'fr3', make: 'forest-river', body: ['class-a'] },
  { label: 'FREEDOM ELITE', value: 'freedom-elite', make: 'thor-motor-coach', body: ['class-b', 'class-c'] },
  { label: 'FREELANDER', value: 'freelander', make: 'coachmen', body: ['class-c'] },
  { label: 'FRONTIER', value: 'frontier', make: 'fleetwood', body: ['class-a'] },
  { label: 'FUZION', value: 'fuzion', make: 'keystone', body: ['5th-wheel'] },
  { label: 'GALLERIA', value: 'galleria', make: 'coachmen', body: ['class-b'] },
  { label: 'GEMINI', value: 'gemini', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'GEMINI TRIP', value: 'gemini-trip', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'GENEVA', value: 'geneva', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'GEORGETOWN', value: 'georgetown', make: 'forest-river', body: ['class-a'] },
  { label: 'GEORGETOWN XL', value: 'georgetown-xl', make: 'forest-river', body: ['class-a'] },
  { label: 'GRANITE RIDGE', value: 'granite-ridge', make: 'jayco', body: ['class-c'] },
  { label: 'GREY WOLF', value: 'grey-wolf', make: 'forest-river', body: ['travel-trailer'] },
  { label: 'GREYHAWK', value: 'greyhawk', make: 'jayco', body: ['class-c'] },
  { label: 'GREYHAWK XL', value: 'greyhawk-xl', make: 'jayco', body: ['class-c'] },
  { label: 'GXV', value: 'gxv', make: 'storyteller-overland', body: ['class-c'] },
  { label: 'HERITAGE', value: 'heritage', make: 'midwest-automotive-designs', body: ['class-b'] },
  { label: 'HURRICANE', value: 'hurricane', make: 'thor-motor-coach', body: ['class-a'] },
  { label: 'IMAGINE', value: 'imagine', make: 'grand-design', body: ['travel-trailer'] },
  { label: 'IMAGINE XLS', value: 'imagine-xls', make: 'grand-design', body: ['travel-trailer'] },
  { label: 'INTERSTATE', value: 'interstate', make: 'airstream', body: ['class-b'] },
  { label: 'INVICTA', value: 'invicta', make: 'holiday-rambler', body: ['class-a'] },
  { label: 'ISATA', value: 'isata', make: 'dynamax', body: ['class-c'] },
  { label: 'ISATA 3', value: 'isata-3', make: 'dynamax', body: ['class-c'] },
  { label: 'ISATA 3 SERIES', value: 'isata-3-series', make: 'dynamax', body: ['class-c'] },
  { label: 'ISATA 5', value: 'isata-5', make: 'dynamax', body: ['class-c'] },
  { label: 'ISATA 5 SERIES', value: 'isata-5-series', make: 'dynamax', body: ['class-c'] },
  { label: 'ISATA SERIES 3', value: 'isata-series-3', make: 'dynamax', body: ['class-c'] },
  { label: 'ISATA SERIES 5', value: 'isata-series-5', make: 'winnebago', body: ['class-c'] },
  { label: 'ISTATA 3', value: 'istata-3', make: 'dynamax', body: ['class-c'] },
  { label: 'JAYFEATHER', value: 'jayfeather', make: 'jayco', body: ['travel-trailer'] },
  { label: 'JAYFLIGHT', value: 'jayflight', make: 'jayco', body: ['travel-trailer'] },
  { label: 'JOURNEY', value: 'journey', make: 'winnebago', body: ['class-a'] },
  { label: 'KNIGHT', value: 'knight', make: 'rev-renegade', body: ['class-c'] },
  { label: 'KODIAK', value: 'kodiak', make: 'keystone', body: ['travel-trailer'] },
  { label: 'KOUNTRY STAR', value: 'kountry-star', make: 'newmar', body: ['class-a'] },
  { label: 'LEGEND', value: 'legend', make: 'midwest-automotive-designs', body: ['class-b'] },
  { label: 'LEPRECHAUN', value: 'leprechaun', make: 'coachmen', body: ['class-c'] },
  { label: 'LEXINGTON', value: 'lexington', make: 'forest-river', body: ['class-c'] },
  { label: 'LEXOR TS', value: 'lexor-ts', make: 'pleasure-way', body: ['class-b'] },
  { label: 'LINEAGE', value: 'lineage', make: 'grand-design', body: ['class-b', 'class-c'] },
  { label: 'LINEAGE F SERIES', value: 'lineage-f-series', make: 'grand-design', body: ['class-c'] },
  { label: 'LINEAGE SERIES F', value: 'lineage-series-f', make: 'grand-design', body: ['class-c'] },
  { label: 'LINEAGE SERIES M', value: 'lineage-series-m', make: 'grand-design', body: ['class-c'] },
  { label: 'LINEAGE SERIES VP', value: 'lineage-series-vp', make: 'grand-design', body: ['class-c'] },
  { label: 'LINEAGE SERIES VT', value: 'lineage-series-vt', make: 'grand-design', body: ['class-b'] },
  { label: 'LUSSO', value: 'lussso', make: 'grech-rv', body: ['class-b'] },
  { label: 'LUXE', value: 'luxe', make: 'midwest-automotive-designs', body: ['class-b'] },
  { label: 'LUXE CRUISER', value: 'luxe-cruiser', make: 'midwest-automotive-designs', body: ['class-b'] },
  { label: 'MAGNITUDE', value: 'magnitude', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'MAGNITUDE GRAND', value: 'magnitude-grand', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'MBH ETHOS', value: 'mbh-ethos', make: 'entegra', body: ['class-b'] },
  { label: 'MELBOURNE', value: 'melbourne', make: 'jayco', body: ['class-c'] },
  { label: 'MELBOURNE PRESTIGE', value: 'melbourne-prestige', make: 'jayco', body: ['class-c'] },
  { label: 'MICRO MINNIE-TT', value: 'micro-minnie-tt', make: 'winnebago-towables', body: ['travel-trailer'] },
  { label: 'MIDAS', value: 'midas', make: 'tiffin', body: ['class-b', 'class-c'] },
  { label: 'MILESTONE', value: 'milestone', make: 'heartland', body: ['5th-wheel'] },
  { label: 'MINNIE WINNIE', value: 'minnie-winnie', make: 'winnebago', body: ['class-c'] },
  { label: 'MIRADA', value: 'mirada', make: 'coachmen', body: ['class-a'] },
  { label: 'MIRAMAR', value: 'miramar', make: 'thor-motor-coach', body: ['class-a'] },
  { label: 'MODE', value: 'mode', make: 'storyteller-overland', body: ['class-b'] },
  { label: 'MODEL G', value: 'model-g', make: 'brinkley-rv', body: ['toy-hauler'] },
  { label: 'MODEL GX', value: 'model-gx', make: 'brinkley-rv', body: ['toy-hauler'] },
  { label: 'MODEL I', value: 'model-i', make: 'brinkley-rv', body: ['travel-trailer'] },
  { label: 'MODEL IX', value: 'model-ix', make: 'brinkley-rv', body: ['travel-trailer'] },
  { label: 'MODEL Z', value: 'model-z', make: 'brinkley-rv', body: ['5th-wheel'] },
  { label: 'MODEL Z AIR', value: 'model-z-air', make: 'brinkley-rv', body: ['travel-trailer'] },
  { label: 'MOMENTUM', value: 'momentum', make: 'grand-design', body: ['toy-hauler'] },
  { label: 'MONTANA', value: 'montana', make: 'keystone', body: ['5th-wheel'] },
  { label: 'NAUTICA', value: 'nautica', make: 'holiday-rambler', body: ['class-a'] },
  { label: 'NAVIGATOR', value: 'navigator', make: 'holiday-rambler', body: ['class-a'] },
  { label: 'NAVION', value: 'navion', make: 'winnebago', body: ['class-c'] },
  { label: 'NEW AIRE', value: 'new-aire', make: 'newmar', body: ['class-a'] },
  { label: 'NO BOUNDRIES', value: 'no-boundaries', make: 'forest-river', body: ['travel-trailer'] },
  { label: 'NORTH TRAIL', value: 'north-trail', make: 'heartland', body: ['travel-trailer'] },
  { label: 'ODYSSEY', value: 'odyssey', make: 'entegra', body: ['class-c'] },
  { label: 'ODYSSEY SE', value: 'odyssey-se', make: 'entegra', body: ['class-c'] },
  { label: 'OMNI', value: 'omni', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'OMNI TRAIL', value: 'omni-trail', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'ONTOUR', value: 'ontour', make: 'pleasure-way', body: ['class-b'] },
  { label: 'OPEN ROAD', value: 'open-road', make: 'tiffin', body: ['class-a'] },
  { label: 'OPEN TRAIL', value: 'open-trail', make: 'tiffin', body: ['class-c'] },
  { label: 'PACE ARROW', value: 'pace-arrow', make: 'fleetwood', body: ['class-a'] },
  { label: 'PALAZZO', value: 'palazzo', make: 'thor-motor-coach', body: ['class-a'] },
  { label: 'PALLADIUM', value: 'palladium', make: 'thor-motor-coach', body: ['class-b'] },
  { label: 'PASADENA', value: 'pasadena', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'PASSAGE', value: 'passage', make: 'midwest-automotive-designs', body: ['class-b'] },
  { label: 'PATRIOT', value: 'patriot', make: 'midwest-automotive-designs', body: ['class-b'] },
  { label: 'PATRIOT 144', value: 'patriot-144', make: 'midwest-automotive-designs', body: ['class-b'] },
  { label: 'PATRIOT CRUISER', value: 'patriot-cruiser', make: 'midwest-automotive-designs', body: ['class-b'] },
  { label: 'PHAETON', value: 'phaeton', make: 'tiffin', body: ['class-a'] },
  { label: 'PHOENIX CRUISER', value: 'phoenix-cruiser', make: 'phoenix', body: ['class-c'] },
  { label: 'PLATEAU', value: 'plateau', make: 'pleasure-way', body: ['class-b', 'class-c'] },
  { label: 'PLATEAU FL', value: 'plateau-fl', make: 'pleasure-way', body: ['class-b'] },
  { label: 'PLATEAU TS', value: 'plateau-ts', make: 'pleasure-way', body: ['class-b'] },
  { label: 'PLATEAU XL', value: 'plateau-xl', make: 'pleasure-way', body: ['class-c'] },
  { label: 'PLAY', value: 'play', make: 'roadtrek', body: ['class-b'] },
  { label: 'PRECEPT', value: 'precept', make: 'jayco', body: ['class-a'] },
  { label: 'PRISM ELITE', value: 'prism-elite', make: 'coachmen', body: ['class-c'] },
  { label: 'PROWLER', value: 'prowler', make: 'heartland', body: ['5th-wheel', 'travel-trailer'] },
  { label: 'PROWLER LYNX', value: 'prowler-lynx', make: 'heartland', body: ['travel-trailer'] },
  { label: 'PURSUIT', value: 'pursuit', make: 'coachmen', body: ['class-a'] },
  { label: 'QUANTUM', value: 'quantum', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'QUANTUM LC', value: 'quantum-lc', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'QWEST', value: 'qwest', make: 'entegra', body: ['class-c'] },
  { label: 'QWEST SE', value: 'qwest-se', make: 'entegra', body: ['class-c'] },
  { label: 'REDHAWK', value: 'redhawk', make: 'jayco', body: ['class-c'] },
  { label: 'REFLECTION 5TH', value: 'reflection-5th', make: 'grand-design', body: ['5th-wheel'] },
  { label: 'RENEGADE VIENNA', value: 'renegade-vienna', make: 'rev-renegade', body: ['class-c'] },
  { label: 'REVEL', value: 'revel', make: 'winnebago', body: ['class-b'] },
  { label: 'REVEL SPORT', value: 'revel-sport', make: 'winnebago', body: ['class-b'] },
  { label: 'RIZE', value: 'rize', make: 'thor-motor-coach', body: ['class-b'] },
  { label: 'ROADTREK', value: 'roadtrek', make: 'roadtrek', body: ['class-b'] },
  { label: 'SALEM CRUISER LITE', value: 'salem-cruiser-lite', make: 'forest-river', body: ['travel-trailer'] },
  { label: 'SANCTUARY', value: 'sanctuary', make: 'thor-motor-coach', body: ['class-b'] },
  { label: 'SCOPE', value: 'scope', make: 'thor-motor-coach', body: ['class-b'] },
  { label: 'SENECA', value: 'seneca', make: 'jayco', body: ['class-c'] },
  { label: 'SENECA PRESTIGE', value: 'seneca-prestige', make: 'jayco', body: ['class-c'] },
  { label: 'SENECA XT', value: 'seneca-xt', make: 'jayco', body: ['class-c'] },
  { label: 'SEQUENCE', value: 'sequence', make: 'thor-motor-coach', body: ['class-b'] },
  { label: 'SIGHTSEER', value: 'sightseer', make: 'winnebago', body: ['class-a'] },
  { label: 'SIGNATURE SERIES', value: 'signature-series', make: 'midwest-automotive-designs', body: ['class-b'] },
  { label: 'SOLERA', value: 'solera', make: 'forest-river', body: ['class-c'] },
  { label: 'SOLIS', value: 'solis', make: 'winnebago', body: ['class-b'] },
  { label: 'SOLIS POCKET', value: 'solis-pocket', make: 'winnebago', body: ['class-b'] },
  { label: 'SOLITUDE', value: 'solitude', make: 'grand-design', body: ['5th-wheel'] },
  { label: 'SOLITUDE INFLUENCE', value: 'solitude-influence', make: 'grand-design', body: ['5th-wheel'] },
  { label: 'SOLSTICE', value: 'solstice', make: 'jayco', body: ['class-b'] },
  { label: 'SOUTHWIND', value: 'southwind', make: 'fleetwood', body: ['class-a'] },
  { label: 'SPIRIT', value: 'spirit', make: 'winnebago', body: ['class-c'] },
  { label: 'SPORTSCOACH', value: 'sportscoach', make: 'coachmen', body: ['class-a'] },
  { label: 'STRADA ION TOUR', value: 'strada-ion-tour', make: 'grech-rv', body: ['class-b'] },
  { label: 'STRADA-ION', value: 'strada-ion', make: 'grech-rv', body: ['class-b'] },
  { label: 'STRADA-ION AWD', value: 'strada-ion-awd', make: 'grech-rv', body: ['class-b'] },
  { label: 'SUNCRUISER', value: 'suncruiser', make: 'itasca', body: ['class-a'] },
  { label: 'SUNDANCE', value: 'sundance', make: 'heartland', body: ['5th-wheel'] },
  { label: 'SUNDANCE XLT', value: 'sundance-xlt', make: 'heartland', body: ['5th-wheel'] },
  { label: 'SUNDANCE XLT TRAILER', value: 'sundance-xlt-trailer', make: 'heartland', body: ['travel-trailer'] },
  { label: 'SUNSEEKER', value: 'sunseeker', make: 'forest-river', body: ['class-c'] },
  { label: 'SUNSTAR', value: 'sunstar', make: 'winnebago', body: ['class-a'] },
  { label: 'SUPREME AIRE', value: 'supreme-aire', make: 'newmar', body: ['class-c'] },
  { label: 'SWIFT', value: 'swift', make: 'jayco', body: ['class-b'] },
  { label: 'SYNERGY', value: 'synergy', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'TALAVERA', value: 'talavera', make: 'thor-motor-coach', body: ['class-b'] },
  { label: 'TELLARO', value: 'tellaro', make: 'thor-motor-coach', body: ['class-b'] },
  { label: 'TERRENO ION', value: 'terreno-ion', make: 'grech-rv', body: ['class-b'] },
  { label: 'THRIVE', value: 'thrive', make: 'winnebago-towables', body: ['travel-trailer'] },
  { label: 'TIBURON', value: 'tiburon', make: 'thor-motor-coach', body: ['class-c'] },
  { label: 'TIFFIN', value: 'tiffin', make: 'tiffin', body: ['class-b'] },
  { label: 'TIMBER RIDGE', value: 'timber-ridge', make: 'other-make', body: ['travel-trailer'] },
  { label: 'TRANQUILITY', value: 'tranquility', make: 'thor-motor-coach', body: ['class-b'] },
  { label: 'TRANSCEND', value: 'transcend', make: 'grand-design', body: ['travel-trailer'] },
  { label: 'TRANSCEND ONE', value: 'transcend-one', make: 'grand-design', body: ['travel-trailer'] },
  { label: 'TRANSCEND XPLOR', value: 'transcend-xplor', make: 'grand-design', body: ['travel-trailer'] },
  { label: 'TRAVATO', value: 'travato', make: 'winnebago', body: ['class-b'] },
  { label: 'TURISMO-I', value: 'turismo-i', make: 'grech-rv', body: ['class-b'] },
  { label: 'TURISMO-ION', value: 'turismo-ion', make: 'grech-rv', body: ['class-b'] },
  { label: 'ULTRA BROUGHAM', value: 'ultra-brougham', make: 'regency', body: ['class-c'] },
  { label: 'UNITY', value: 'unity', make: 'leisure-travel-vans', body: ['class-b', 'class-c'] },
  { label: 'VACANZA-ION', value: 'vacanza-ion', make: 'grech-rv', body: ['class-b'] },
  { label: 'VACATIONER', value: 'vacationer', make: 'holiday-rambler', body: ['class-a'] },
  { label: 'VALENCIA', value: 'valencia', make: 'rev-renegade', body: ['class-c'] },
  { label: 'VEGAS', value: 'vegas', make: 'thor-motor-coach', body: ['class-a'] },
  { label: 'VENTANA', value: 'ventana', make: 'newmar', body: ['class-a'] },
  { label: 'VENTANA LE', value: 'ventana-le', make: 'newmar', body: ['class-a'] },
  { label: 'VERACRUZ', value: 'veracruz', make: 'rev-renegade', body: ['class-c'] },
  { label: 'VERONA', value: 'verona', make: 'rev-renegade', body: ['class-c'] },
  { label: 'VERONA LE', value: 'verona-le', make: 'rev-renegade', body: ['class-c'] },
  { label: 'VIA', value: 'via', make: 'winnebago', body: ['class-a'] },
  { label: 'VIENNA', value: 'vienna', make: 'rev-renegade', body: ['class-c'] },
  { label: 'VIEW', value: 'view', make: 'winnebago', body: ['class-c'] },
  { label: 'VILANO', value: 'vilano', make: 'vanleigh', body: ['5th-wheel'] },
  { label: 'VILLAGIO', value: 'villagio', make: 'rev-renegade', body: ['class-c'] },
  { label: 'VISION', value: 'vision', make: 'entegra', body: ['class-a'] },
  { label: 'VISION SE', value: 'vision-se', make: 'entegra', body: ['class-a'] },
  { label: 'VISION XL', value: 'vision-xl', make: 'entegra', body: ['class-a'] },
  { label: 'VISTA', value: 'vista', make: 'winnebago', body: ['class-a'] },
  { label: 'VITA', value: 'vita', make: 'winnebago', body: ['class-c'] },
  { label: 'VOLTAGE', value: 'voltage', make: 'keystone', body: ['5th-wheel'] },
  { label: 'WAYFARER', value: 'wayfarer', make: 'tiffin', body: ['class-c'] },
  { label: 'WINDSPORT', value: 'windsport', make: 'thor-motor-coach', body: ['class-a'] },
  { label: 'WONDER', value: 'wonder', make: 'leisure-travel-vans', body: ['class-b', 'class-c'] },
  { label: 'ZEPHYR', value: 'zephyr', make: 'tiffin', body: ['class-a'] },
  { label: 'ZION', value: 'zion', make: 'roadtrek', body: ['class-b'] },
];

export const inventoryTypeOptions = [
  { label: 'New', value: 'new' },
  { label: 'Used', value: 'used' },
];

export const sortByOptions = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
];

export type SortByValue = (typeof sortByOptions)[number]['value'];

export const minPriceOptions = [
  { label: '$25,000', value: '25000' },
  { label: '$50,000', value: '50000' },
  { label: '$75,000', value: '75000' },
  { label: '$100,000', value: '100000' },
  { label: '$250,000', value: '250000' },
  { label: '$500,000', value: '500000' },
  { label: '$750,000', value: '750000' },
  { label: '$1,000,000', value: '1000000' },
];

export const maxPriceOptions = [
  { label: '$25,000', value: '25000' },
  { label: '$50,000', value: '50000' },
  { label: '$75,000', value: '75000' },
  { label: '$100,000', value: '100000' },
  { label: '$250,000', value: '250000' },
  { label: '$500,000', value: '500000' },
  { label: '$750,000', value: '750000' },
  { label: '$1,000,000', value: '1000000' },
];

export const rvTypeOptions = [
  { label: 'Adventure Vans', value: 'adventure-van' },
  { label: 'Overlander', value: 'overlander' },
  { label: 'Touring Van', value: 'touring-van' },
];

export const driveTrainOptions = [
  { label: '4WD', value: '4wd-4-wheel-drive' },
  { label: 'AWD', value: 'awd-all-wheel-drive' },
  { label: 'RWD', value: 'rwd-rear-wheel-drive' },
];

export const fuelOptions = [
  { label: 'Gas', value: 'gas' },
  { label: 'Diesel', value: 'diesel' },
];

export const lengthOptions = [
  { label: 'Under 25 ft', value: 'compact' },
  { label: '25-35 ft', value: 'mid' },
  { label: 'Over 35 ft', value: 'long' },
];

export const sleepOptions = [
  { label: '1 Sleep', value: '1' },
  { label: '2 Sleeps', value: '2' },
  { label: '3 Sleeps', value: '3' },
  { label: '4 Sleeps', value: '4' },
  { label: '5+ Sleeps', value: '5+' },
];

export const slideOutOptions = [
  { label: '1 Slideout', value: '1' },
  { label: '2 Slideouts', value: '2' },
  { label: '3 Slideouts', value: '3' },
  { label: '4 Slideouts', value: '4' },
  { label: '5+ Slideouts', value: '5+' },
];

export const featureOptions = [
  { label: 'Solar', value: 'solar' },
  { label: 'Lithium Battery', value: 'lithium-battery' },
  { label: 'Inverter', value: 'inverter' },
  { label: 'Shower', value: 'shower' },
  { label: 'Toilet', value: 'toilet' },
  { label: 'Heated', value: 'heated' },
  { label: 'AC', value: 'ac' },
  { label: 'Kitchen', value: 'kitchen' },
  { label: 'Pop-Top', value: 'pop-top' },
  { label: 'Roof Rack', value: 'roof-rack' },
  { label: 'Awning', value: 'awning' },
];

export const locationOptions = [
  { label: 'San Diego, CA', value: 'san-diego-ca' },
  { label: 'West Sacramento, CA', value: 'west-sacramento-ca' },
  { label: 'Fremont, CA', value: 'fremont-ca' },
  { label: 'Davie, FL', value: 'davie-fl' },
  { label: 'Orlando (Sanford), FL', value: 'orlando-sanford-fl' },
  { label: 'Port St. Lucie, FL', value: 'port-st-lucie-fl' },
  { label: 'Ft. Myers, FL', value: 'ft-myers-fl' },
  { label: 'Phoenix, AZ', value: 'phoenix-az' },
  { label: 'Mesa, AZ', value: 'mesa-az' },
  { label: 'Tucson, AZ', value: 'tucson-az' },
  { label: 'Albuquerque, NM', value: 'albuquerque-nm' },
];

export const locationRegionOptions = [
  {
    id: 'east-coast',
    label: 'East Coast',
    values: ['port-st-lucie-fl', 'orlando-sanford-fl', 'ft-myers-fl', 'davie-fl'],
  },
  {
    id: 'west-coast',
    label: 'West Coast',
    values: [
      'phoenix-az',
      'west-sacramento-ca',
      'tucson-az',
      'mesa-az',
      'san-diego-ca',
      'albuquerque-nm',
      'fremont-ca',
    ],
  },
] as const;

export function locationLabelFromValue(value: string): string {
  return locationOptions.find((opt) => opt.value === value)?.label ?? '';
}

export function labelFromValue(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return '';
  const parts = value.split(/[-_\s]+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function labelFromCustomTags(customTags: string[] | null | undefined, key: string): string {
  if (!customTags?.length) return '';
  const tag = customTags.find((t) => t.startsWith(`${key}:`));
  if (!tag) return '';
  const value = tag.split(':')[1].trim();
  if (!value) return '';
  return labelFromValue(value);
}

export function unitThumbnailSrc(unit?: InventoryUnit): string {
  if (!unit) return '/images/photos_coming_soon.jpg';
  if (unit.thumbnails?.length) return unit.thumbnails[0]!;
  if (unit.images?.length) return unit.images[0]!;
  if (unit.defaultImageUrl) return unit.defaultImageUrl;
  return '/images/photos_coming_soon.jpg';
}

export function getMakeOptions({ body }: { body?: string }) {
  return makeOptions
    .filter((make) => !body || make.body.includes(body))
    .map((make) => ({
      label: make.label,
      value: make.value,
    }));
}

export function getModelOptions({ make, body }: { make?: string; body?: string }) {
  return modelOptions
    .filter((model) => (!make || model.make === make) && (!body || model.body.includes(body)))
    .map((model) => ({
      label: model.label,
      value: model.value,
    }));
}

export function getInventoryPricing(unit: InventoryUnit) {
  const num = (value: number | undefined) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const firstPositive = (...values: number[]) => values.find((value) => value > 0) ?? 0;

  const isTooLowToShow = Boolean(unit.isTooLowToShow);

  const msrp = num(unit.wI_ListPrice);
  const mapPrice = num(unit.wI_MapPrice);
  const salePrice = num(unit.wI_SalePrice);
  const websitePrice = num(unit.websitePrice);
  const rebateAmount = num(unit.rebate?.amount);

  const displayPrice = firstPositive(websitePrice, salePrice, mapPrice, msrp);
  const netPrice = displayPrice > 0 && rebateAmount > 0 ? Math.max(displayPrice - rebateAmount, 0) : displayPrice;
  const currentPrice = !isTooLowToShow && displayPrice > 0 ? (rebateAmount > 0 ? netPrice : displayPrice) : 0;

  const discountAmount = msrp && displayPrice && msrp > displayPrice ? msrp - displayPrice : 0;
  const savingAmount = msrp && netPrice && msrp > netPrice ? msrp - netPrice : 0;
  const percentOff = savingAmount && msrp ? Math.round((savingAmount / msrp) * 100) : 0;

  return {
    isTooLowToShow,
    msrp,
    mapPrice,
    salePrice,
    websitePrice,
    rebateAmount,
    displayPrice,
    netPrice,
    currentPrice,
    discountAmount,
    savingAmount,
    percentOff,
  };
}
