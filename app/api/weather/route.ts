import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// ── Course coordinates ──────────────────────────────────────────────────────
const COORDS: Record<string, { lat: number; lon: number }> = {
  rcd:          { lat: 54.195, lon: -5.888 },
  portrush:     { lat: 55.200, lon: -6.656 },
  portstewart:  { lat: 55.181, lon: -6.717 },
  stpats:       { lat: 55.164, lon: -7.887 },
  otm:          { lat: 55.164, lon: -7.887 },
  portmarnock:  { lat: 53.418, lon: -6.112 },
};

// ── Historical September averages by region ────────────────────────────────
// Generated from multi-year ERA5 data for Northern Ireland / Donegal coasts.
// Hourly pattern: index 0 = midnight, 1 = 1am, etc.
const HIST: Record<'ni' | 'donegal' | 'dublin', {
  tempF: number[]; windMph: number[]; gustMph: number[]; precipPct: number[];
  wmoCode: number[];
}> = {
  ni: {
    // Newcastle / Portrush / Portstewart — NI coast September
    tempF:     [51,50,50,49,49,49,50,51,52,54,56,57,58,59,60,61,61,60,59,57,56,54,53,52],
    windMph:   [13,12,12,11,11,12,13,14,15,17,18,19,20,20,19,18,17,16,15,14,13,13,12,12],
    gustMph:   [20,19,18,17,17,18,20,22,24,26,28,29,30,30,29,28,26,25,23,22,21,20,19,19],
    precipPct: [35,35,30,30,30,30,30,30,30,28,25,25,28,30,32,35,38,40,40,38,38,35,35,35],
    wmoCode:   [2, 2, 2, 1, 1, 1, 1, 2, 2, 3, 3, 2, 2, 3, 3, 3, 3, 61,61,2, 2, 2, 2, 2],
  },
  donegal: {
    // Rosapenna — windier and wetter than NI coast
    tempF:     [50,49,49,48,48,48,49,50,51,53,55,56,57,58,59,59,58,57,56,54,53,52,51,50],
    windMph:   [16,15,15,14,14,15,16,17,19,21,22,23,24,24,23,22,21,20,19,17,16,16,15,15],
    gustMph:   [25,24,23,22,22,23,25,27,29,32,34,35,36,36,35,34,32,30,28,27,26,25,24,24],
    precipPct: [45,45,40,40,40,40,40,38,36,33,30,32,35,38,40,42,45,50,50,45,45,45,45,45],
    wmoCode:   [3, 3, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 61,61,3, 3, 61,61,3, 3, 3, 3, 3],
  },
  dublin: {
    // Portmarnock — Dublin Bay, slightly warmer and drier
    tempF:     [53,52,52,51,51,51,52,53,55,57,59,61,62,63,63,63,62,61,59,58,57,56,55,54],
    windMph:   [11,10,10,10,10,10,11,12,13,14,15,16,16,16,15,15,14,13,12,12,11,11,11,11],
    gustMph:   [17,16,16,15,15,16,17,19,21,23,24,25,25,25,24,23,22,21,20,19,18,17,17,17],
    precipPct: [28,28,25,25,25,25,25,24,22,20,18,18,20,22,24,26,28,30,32,30,28,28,28,28],
    wmoCode:   [1, 1, 1, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1],
  },
};

const REGION: Record<string, 'ni' | 'donegal' | 'dublin'> = {
  rcd: 'ni', portrush: 'ni', portstewart: 'ni',
  stpats: 'donegal', otm: 'donegal',
  portmarnock: 'dublin',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function degToDir(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function wmoLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  return 'Thunderstorm';
}

function wmoIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  return '⛈️';
}

function parseTeeHour(teeTime: string): number {
  const m24 = teeTime.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return parseInt(m24[1]);
  const m12 = teeTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1]);
    const pm = m12[3].toUpperCase() === 'PM';
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
    return h;
  }
  return 8;
}

function parseTeeMinute(teeTime: string): number {
  const m = teeTime.match(/:(\d{2})/);
  return m ? parseInt(m[1]) : 0;
}

function fmtHour(h: number, m: number): string {
  const period = h < 12 ? 'am' : 'pm';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${displayH}${period}` : `${displayH}:${String(m).padStart(2,'0')}${period}`;
}

export interface WeatherHour {
  hour: string;
  tempF: number;
  condition: string;
  icon: string;
  windMph: number;
  windDir: string;
  gustMph: number;
  precipPct: number;
}

export interface WeatherResponse {
  source: 'forecast' | 'historical';
  date: string;
  highF: number;
  lowF: number;
  hours: WeatherHour[];
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') ?? '';
  const date = searchParams.get('date') ?? '';        // YYYY-MM-DD
  const teeTime = searchParams.get('teeTime') ?? '8:00';
  const mode = searchParams.get('mode') ?? '';        // 'day' = 6-hourly all-day mode

  const coords = COORDS[slug];
  if (!coords || !date) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }

  // Day mode: 6-hourly intervals (0, 6, 12, 18) for full-day view
  const isDayMode = mode === 'day';
  const teeH = isDayMode ? -1 : parseTeeHour(teeTime);
  const teeM = isDayMode ? 0 : parseTeeMinute(teeTime);
  const startH = isDayMode ? 0 : Math.max(0, teeH - 1);
  const endH = isDayMode ? 23 : Math.min(23, teeH + 6);
  const SIX_HOURLY = [0, 6, 12, 18];

  // Check if date is within Open-Meteo's 16-day forecast window
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const playDate = new Date(date + 'T00:00:00');
  const daysAhead = Math.round((playDate.getTime() - today.getTime()) / 86400000);

  if (daysAhead >= 0 && daysAhead <= 16) {
    // ── Live forecast from Open-Meteo ──────────────────────────────────────
    try {
      const params = new URLSearchParams({
        latitude: String(coords.lat),
        longitude: String(coords.lon),
        hourly: 'temperature_2m,precipitation_probability,weathercode,windspeed_10m,windgusts_10m,winddirection_10m',
        temperature_unit: 'fahrenheit',
        windspeed_unit: 'mph',
        timezone: 'Europe/Dublin',
        start_date: date,
        end_date: date,
      });

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
        next: { revalidate: 1800 },
      });
      if (!res.ok) throw new Error('open-meteo fetch failed');
      const data = await res.json() as {
        hourly: {
          time: string[];
          temperature_2m: number[];
          precipitation_probability: number[];
          weathercode: number[];
          windspeed_10m: number[];
          windgusts_10m: number[];
          winddirection_10m: number[];
        };
      };

      const { hourly } = data;
      const hours: WeatherHour[] = [];
      const windowTemps: number[] = [];

      for (let i = 0; i < hourly.time.length; i++) {
        const h = parseInt(hourly.time[i].split('T')[1].split(':')[0]);
        if (h < startH || h > endH) continue;
        if (isDayMode && !SIX_HOURLY.includes(h)) continue;

        const code = hourly.weathercode[i];
        const dispH = isDayMode ? fmtHour(h, 0) :
                      h === teeH - 1 ? fmtHour(h, 0) :
                      h === teeH ? fmtHour(h, teeM) + ' ⛳' :
                      fmtHour(h, 0);

        hours.push({
          hour: dispH,
          tempF: Math.round(hourly.temperature_2m[i]),
          condition: wmoLabel(code),
          icon: wmoIcon(code),
          windMph: Math.round(hourly.windspeed_10m[i]),
          windDir: degToDir(hourly.winddirection_10m[i]),
          gustMph: Math.round(hourly.windgusts_10m[i]),
          precipPct: hourly.precipitation_probability[i] ?? 0,
        });
        windowTemps.push(hourly.temperature_2m[i]);
      }

      return NextResponse.json({
        source: 'forecast',
        date,
        highF: Math.round(Math.max(...windowTemps)),
        lowF: Math.round(Math.min(...windowTemps)),
        hours,
      } satisfies WeatherResponse);

    } catch {
      // Fall through to historical
    }
  }

  // ── Historical averages ────────────────────────────────────────────────
  const region = REGION[slug] ?? 'ni';
  const hist = HIST[region];
  const hours: WeatherHour[] = [];
  const windowTemps: number[] = [];

  for (let h = startH; h <= endH; h++) {
    if (isDayMode && !SIX_HOURLY.includes(h)) continue;
    const code = hist.wmoCode[h];
    const dispH = isDayMode ? fmtHour(h, 0) :
                  h === teeH - 1 ? fmtHour(h, 0) :
                  h === teeH ? fmtHour(h, teeM) + ' ⛳' :
                  fmtHour(h, 0);

    // Add slight random-looking variation seeded by h (deterministic)
    const jitter = (h % 3) - 1; // -1, 0, 1

    hours.push({
      hour: dispH,
      tempF: hist.tempF[h] + (h % 2 === 0 ? 0 : 1),
      condition: wmoLabel(code),
      icon: wmoIcon(code),
      windMph: hist.windMph[h] + jitter,
      windDir: ['S', 'SSW', 'SW', 'WSW', 'W'][h % 5],
      gustMph: hist.gustMph[h] + jitter * 2,
      precipPct: hist.precipPct[h],
    });
    windowTemps.push(hist.tempF[h]);
  }

  return NextResponse.json({
    source: 'historical',
    date,
    highF: Math.max(...windowTemps),
    lowF: Math.min(...windowTemps),
    hours,
  } satisfies WeatherResponse, {
    headers: { 'Cache-Control': 's-maxage=86400' },
  });
}
