export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export function formatDateTime(isoStr: string): string {
  return new Date(isoStr).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
}

export function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });
}

export const TRIP_TZ = 'Europe/Dublin';

// Everything on this trip happens on Irish time — render it that way no matter
// which side of the Atlantic the phone is on.
export function formatDublin(isoStr: string): string {
  return new Date(isoStr).toLocaleString('en-US', {
    timeZone: TRIP_TZ,
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

// Arrival zones by airport — a flight home lands on home time, not Irish time
const AIRPORT_TZ: Record<string, string> = {
  DUB: 'Europe/Dublin', SNN: 'Europe/Dublin', BFS: 'Europe/London', LHR: 'Europe/London',
  SFO: 'America/Los_Angeles', LAX: 'America/Los_Angeles', SEA: 'America/Los_Angeles',
  EWR: 'America/New_York', JFK: 'America/New_York', BOS: 'America/New_York',
  ORD: 'America/Chicago', DTW: 'America/Detroit', FCO: 'Europe/Rome',
};

export function zoneForAirport(code: string | null | undefined): string {
  if (!code) return TRIP_TZ;
  return AIRPORT_TZ[code.trim().toUpperCase()] ?? TRIP_TZ;
}

export function formatInZone(isoStr: string, timeZone: string): string {
  return new Date(isoStr).toLocaleString('en-US', {
    timeZone,
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
}

// "2026-09-11T11:45" as the given zone sees it — for datetime-local inputs
export function toZoneInput(isoStr: string, timeZone = TRIP_TZ): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date(isoStr));
  const get = (t: string) => parts.find(p => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour') === '24' ? '00' : get('hour')}:${get('minute')}`;
}

// Reverse of the above: read a datetime-local value as wall-clock in that zone
export function fromZoneInput(value: string, timeZone = TRIP_TZ): string {
  const guess = new Date(value + 'Z');
  const first = new Date(guess.getTime() - zoneOffsetMs(guess, timeZone));
  // Second pass catches a DST boundary falling between the two instants
  return new Date(guess.getTime() - zoneOffsetMs(first, timeZone)).toISOString();
}

function zoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at);
  const get = (t: string) => parseInt(parts.find(p => p.type === t)!.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUtc - at.getTime();
}

// Apple Maps on the iPhone, maps.apple.com everywhere else
export function mapsHref(query: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

export function initials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export function railClass(railColor: string): string {
  const map: Record<string, string> = {
    '#7A1A2B': 'rail-rcd',
    '#163A5F': 'rail-portrush',
    '#11574B': 'rail-portstewart',
    '#0F5631': 'rail-stpats',
    '#4E2F6B': 'rail-otm',
  };
  return map[railColor] ?? '';
}

export function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function kindIcon(kind: string): string {
  return { travel: '✈', golf: '⛳', lodging: '🏨', note: '📌', dining: '🍽️' }[kind] ?? '•';
}
