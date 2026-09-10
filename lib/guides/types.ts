// Field guide content, transcribed from the printed guides.
// `joe: true` marks the passages that were bold in the original — Joe's own
// words, as opposed to the club's course guide.

export interface GuideSection {
  label: 'TEE' | 'CLUB' | 'LINE' | 'BUNKERS' | 'WATCH' | 'IN' | 'JOE' | 'NOTE';
  text: string;
  joe?: boolean;
}

export interface GuideHole {
  n: number;
  par: number;
  yards: number;
  si: number;
  tags: string[];
  source: 'joe' | 'guide';
  sections: GuideSection[];
  offTheTee: string;      // the card's last column
  teeIsJoe?: boolean;     // bold on the card
}

export interface CourseGuide {
  slug: string;
  name: string;
  nameLines: string[];    // for the cover
  subtitle: string;
  tees: string;
  par: number;
  yards: number;
  architects: string;
  strapline: string;
  cover: string;
  rulesTitle: string;
  rulesIntro: string;
  rules: { title: string; body: string }[];
  holes: GuideHole[];
  quickLook: { title: string; body: string; joe?: boolean }[];
  closing: string[];
  closingSub: string;
}

export const outYards = (g: CourseGuide) => g.holes.slice(0, 9).reduce((s, h) => s + h.yards, 0);
export const inYards = (g: CourseGuide) => g.holes.slice(9).reduce((s, h) => s + h.yards, 0);
export const outPar = (g: CourseGuide) => g.holes.slice(0, 9).reduce((s, h) => s + h.par, 0);
export const inPar = (g: CourseGuide) => g.holes.slice(9).reduce((s, h) => s + h.par, 0);
