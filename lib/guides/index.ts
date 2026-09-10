import { rcdGuide } from './rcd';
import { portrushGuide } from './portrush';
import type { CourseGuide } from './types';

export const GUIDES: Record<string, CourseGuide> = {
  rcd: rcdGuide,
  portrush: portrushGuide,
};

export function guideFor(slug: string): CourseGuide | null {
  return GUIDES[slug] ?? null;
}

// The itinerary and match tabs carry course names as free text, so match on
// the names we know rather than threading a slug through every caller.
const NAME_TO_SLUG: [RegExp, string][] = [
  [/royal county down|county down/i, 'rcd'],
  [/royal portrush|portrush.*dunluce|dunluce/i, 'portrush'],
];

export function guideSlugForText(text: string | null | undefined): string | null {
  if (!text) return null;
  if (/annesley/i.test(text)) return null; // shares "County Down" in its name
  if (/portstewart/i.test(text)) return null;
  for (const [re, slug] of NAME_TO_SLUG) if (re.test(text)) return slug;
  return null;
}

export type { CourseGuide, GuideHole, GuideSection } from './types';
