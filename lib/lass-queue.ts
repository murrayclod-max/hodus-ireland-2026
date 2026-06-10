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
  `Photorealistic vertical 9:16 iPhone wallpaper. An attractive adult Irish woman in ` +
  `her late 20s wearing a playful Amazon Halloween-style costume of a ${profession}. ` +
  `Set in County ${county}, Ireland during an extreme 95°F summer heat wave. ` +
  `Bright midday sun blazing, heat haze visible in the distance, she is holding a ` +
  `cold icy drink with condensation. PG-13, tasteful, fun, summery. No text, no logos, ` +
  `no watermarks. Shot on 85mm lens, shallow depth of field, subject perfectly ` +
  `centred in frame with headroom at the top for a clock overlay. Vibrant colours, ` +
  `cinematic lighting, magazine quality.`;
