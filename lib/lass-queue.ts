export interface DaySpec {
  day_number: number;
  profession: string;
  county: string;
}

export const LASS_QUEUE: DaySpec[] = [
  { day_number:  1, profession: 'firefighter',           county: 'Kerry'       },
  { day_number:  2, profession: 'heart surgeon',          county: 'Dublin'      },
  { day_number:  3, profession: 'barrister',              county: 'Cork'        },
  { day_number:  4, profession: 'veterinarian with sheep',county: 'Galway'      },
  { day_number:  5, profession: 'Garda detective',        county: 'Limerick'    },
  { day_number:  6, profession: 'marine biologist',       county: 'Clare'       },
  { day_number:  7, profession: 'golf pro',               county: 'Antrim'      },
  { day_number:  8, profession: 'helicopter pilot',       county: 'Donegal'     },
  { day_number:  9, profession: 'whiskey distiller',      county: 'Tipperary'   },
  { day_number: 10, profession: 'archaeologist',          county: 'Meath'       },
  { day_number: 11, profession: 'rugby referee',          county: 'Munster'     },
  { day_number: 12, profession: 'sea captain',            county: 'Mayo'        },
  { day_number: 13, profession: 'pastry chef',            county: 'Waterford'   },
  { day_number: 14, profession: 'horse trainer',          county: 'Kildare'     },
  { day_number: 15, profession: 'lifeguard',              county: 'Wexford'     },
  { day_number: 16, profession: 'architect',              county: 'Wicklow'     },
  { day_number: 17, profession: 'pub owner',              county: 'Sligo'       },
  { day_number: 18, profession: 'astronomer',             county: 'Offaly'      },
  { day_number: 19, profession: 'boxing coach',           county: 'Louth'       },
  { day_number: 20, profession: 'park ranger',            county: 'Kerry'       },
  { day_number: 21, profession: 'race car driver',        county: 'Dublin'      },
  { day_number: 22, profession: 'harpist',                county: 'Leitrim'     },
  { day_number: 23, profession: 'mountaineer',            county: 'Down'        },
  { day_number: 24, profession: 'fashion designer',       county: 'Cork'        },
  { day_number: 25, profession: 'scuba diver',            county: 'Galway'      },
  { day_number: 26, profession: 'bartender',              county: 'Kilkenny'    },
  { day_number: 27, profession: 'football manager',       county: 'Roscommon'   },
  { day_number: 28, profession: 'lighthouse keeper',      county: 'Donegal'     },
  { day_number: 29, profession: 'award-winning chef',     county: 'Tipperary'   },
  { day_number: 30, profession: 'neuroscientist',         county: 'Belfast'     },
  { day_number: 31, profession: 'surf instructor',        county: 'Clare'       },
  { day_number: 32, profession: 'fighter pilot',          county: 'Meath'       },
  { day_number: 33, profession: 'cattle farmer',          county: 'Longford'    },
  { day_number: 34, profession: 'Olympic swimmer',        county: 'Antrim'      },
  { day_number: 35, profession: 'wedding photographer',   county: 'Wicklow'     },
];

export const PROMPT_TEMPLATE = (profession: string, county: string): string =>
  `Vertical 9:16 pinup calendar photo, Pirelli calendar meets Sports Illustrated Swimsuit. ` +
  `An exceptionally beautiful glamorous Irish woman in her mid-20s, model-level stunning — ` +
  `perfect features, radiant freckled skin, bright confident smile. ` +
  `Scorching 95°F Irish summer heat wave in County ${county}. ` +
  `She is wearing tiny denim cut-off shorts and a knotted crop top tied above the midriff, ` +
  `both damp from the heat. Barefoot. Her outfit or a single prop subtly nods to her ` +
  `profession as a ${profession} — one clever visual reference, nothing costume-like. ` +
  `Iconic County ${county} landscape behind her — coastline, cliffs, rolling green hills, ` +
  `or a relevant local landmark. She is pressing a cold sweating glass bottle against her ` +
  `cheek or neck, eyes playfully half-closed from the heat. ` +
  `Skin glistening. Legs, midriff, and arms on full show. Classic pinup pose — ` +
  `one hip out, effortlessly glamorous, playful and confident. ` +
  `85mm lens, f/1.8 shallow depth of field, warm golden afternoon sun backlighting her hair. ` +
  `PG — no nudity. Vogue / Pirelli calendar quality. Photorealistic. ` +
  `No text, no logos, no watermarks. Headroom at top for clock overlay.`;
