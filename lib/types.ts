export type Team = 'murray' | 'harris';
export type MatchStatus = 'pending' | 'live' | 'final';
export type ItineraryKind = 'travel' | 'golf' | 'lodging' | 'note';
export type FlightDirection = 'out' | 'return';
export type HoleResult = 'murray' | 'harris' | 'halved';
export type RoundFormat = 'fourball' | 'altshot';

export interface Player {
  id: string;
  auth_user_id: string | null;
  name: string;
  first_name: string;
  handicap_index: number | null;
  ghin: string | null;
  team: Team;
  is_captain: boolean;
  is_admin: boolean;
  avatar_url: string | null;
  bio: string | null;
  home_club: string | null;
  nickname: string | null;
  phone: string | null;
  fun_facts: Record<string, unknown> | null;
}

export interface CourseTee {
  name: string;
  yards: number;
  rating: number;
  slope: number;
  par?: number;
  si?: number[];
}

export interface GameFormat {
  key: string;
  name: string;
  params: Record<string, number>;
  notes_md: string | null;
  sort: number;
}

export interface Course {
  id: string;
  slug: string;
  name: string;
  location: string;
  par: number;
  yards: number;
  designer: string;
  founded: string | null;
  rail_color: string;
  crest_url: string | null;
  signature_holes: SignatureHole[];
  notes_md: string | null;
  sort: number;
  tees: CourseTee[];
}

export interface SignatureHole {
  hole: number;
  name: string;
  par: number;
  yards: number;
  note: string;
}

export interface ItineraryItem {
  id: string;
  day_date: string;
  title: string;
  detail: string | null;
  kind: ItineraryKind;
  sort: number;
}

export interface Round {
  id: string;
  round_no: number;
  course_id: string;
  play_date: string;
  tee_time: string;
  format: RoundFormat;
  is_altshot: boolean;
  selected_tee: string | null;
  courses?: Course;
}

export interface Pairing {
  id: string;
  round_id: string;
  team: Team;
  player_a: string;
  player_b: string;
  slot: number;
  player_a_data?: Player;
  player_b_data?: Player;
}

export interface Match {
  id: string;
  round_id: string;
  murray_pairing_id: string;
  harris_pairing_id: string;
  status: MatchStatus;
  closed_out_hole: number | null;
  murray_points: number;
  harris_points: number;
  notes: string | null;
  game_format_key: string;
}

export interface HoleResultRow {
  id: string;
  match_id: string;
  hole: number;
  result: HoleResult | null;
}

export interface Flight {
  id: string;
  player_id: string;
  direction: FlightDirection;
  airline: string | null;
  flight_no: string | null;
  from_code: string | null;
  to_code: string | null;
  depart_at: string | null;
  arrive_at: string | null;
  notes: string | null;
  players?: Player;
}

export interface Message {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  players?: Player;
}

export interface Photo {
  id: string;
  uploader_id: string;
  storage_path: string;
  caption: string | null;
  round_id: string | null;
  created_at: string;
  players?: Player;
}

export interface TripSettings {
  id: string;
  buy_in: number;
  per_round: number;
  ace_pool_per_man: number;
  points_win: number;
  points_half: number;
  half_log_18: number;
  half_log_18_tie: number;
  rules_md: string | null;
}

export interface Ace {
  id: string;
  player_id: string;
  round_id: string;
  hole: number;
  note: string | null;
  created_at: string;
  players?: Player;
}
