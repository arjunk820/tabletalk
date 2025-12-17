export interface YelpUserContext {
  locale: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface YelpChatRequest {
  query: string;
  chat_id?: string | null;
  user_context: YelpUserContext;
}

export interface YelpTag {
  tag_type: 'business' | 'highlight';
  start: number;
  end: number;
  meta?: {
    business_id: string;
  };
}

export interface YelpResponse {
  text: string;
  tags: YelpTag[];
}

export interface YelpBusinessLocation {
  address1: string;
  address2: string | null;
  address3: string | null;
  city: string;
  zip_code: string | null;
  state: string;
  country: string;
  formatted_address: string;
}

export interface YelpBusinessCoordinates {
  latitude: number;
  longitude: number;
}

export interface YelpBusinessCategory {
  alias: string;
  title: string;
}

export interface YelpBusinessSummaries {
  short: string | null;
  medium: string | null;
  long: string | null;
}

export interface YelpBusinessPhoto {
  original_url: string;
}

export interface YelpBusinessContextualInfo {
  summary?: string | null;
  review_snippets?: unknown[];
  business_hours?: unknown[];
  photos?: YelpBusinessPhoto[];
  review_snippet?: string | null;
}

export interface YelpBusiness {
  id: string;
  alias: string;
  name: string;
  url: string;
  location: YelpBusinessLocation;
  coordinates: YelpBusinessCoordinates;
  review_count: number;
  price: string | null;
  rating: number;
  categories: YelpBusinessCategory[];
  phone: string;
  summaries: YelpBusinessSummaries;
  attributes?: Record<string, unknown>;
  contextual_info?: YelpBusinessContextualInfo;
}

export interface YelpEntity {
  businesses: YelpBusiness[];
}

export interface YelpChatResponse {
  response: YelpResponse;
  types: string[];
  entities: YelpEntity[];
  chat_id: string;
}

