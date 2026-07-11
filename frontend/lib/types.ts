export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_host: boolean;
  identity_verified: boolean;
  created_at: string;
}

export interface ListingCard {
  id: number;
  title: string;
  location_city: string;
  location_area: string;
  lat?: number | null;
  lng?: number | null;
  price_per_night: number;
  property_type: string;
  vibe: string;
  max_guests: number;
  photo_url?: string | null;
  avg_rating?: number | null;
  review_count: number;
  is_guest_favourite?: boolean;
}

export interface ListingListResponse {
  items: ListingCard[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Photo {
  id: number;
  url: string;
  sort_order: number;
}

export interface Amenity {
  id: number;
  name: string;
}

export interface Host {
  id: number;
  name: string;
}

export interface ListingDetail {
  id: number;
  title: string;
  description: string;
  location_city: string;
  location_area: string;
  lat?: number | null;
  lng?: number | null;
  price_per_night: number;
  property_type: string;
  vibe: string;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  photos: Photo[];
  amenities: Amenity[];
  host: Host;
  avg_rating?: number | null;
  review_count: number;
  created_at: string;
}

export interface Review {
  id: number;
  guest_id: number;
  rating: number;
  comment: string;
  guest_name: string;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
  host_reply?: string | null;
  host_reply_at?: string | null;
}

export interface HostReview extends Review {
  listing_id: number;
  listing_title: string;
}

export interface GuestReview extends Review {
  listing_id: number;
  listing_title: string;
}

export interface ReviewWatch {
  id: number;
  listing_id: number;
  listing_title: string;
  guest_id: number;
  guest_name: string;
  host_id: number;
  rating: number;
  comment: string;
  like_count: number;
  host_reply?: string | null;
  host_reply_at?: string | null;
  created_at: string;
}

export interface AvailabilityRange {
  check_in: string;
  check_out: string;
}

export interface Booking {
  id: number;
  listing_id: number;
  listing_title: string;
  listing_photo?: string | null;
  location_city: string;
  host_id: number;
  guest_id: number;
  guest_name: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  refund_amount?: number | null;
  refund_percent?: number | null;
  status: string;
  created_at: string;
  has_review: boolean;
  can_review: boolean;
  review_id?: number | null;
  host_reply?: string | null;
  host_reply_at?: string | null;
}

export interface RefundPreview {
  refund_amount: number;
  refund_percent: number;
  total_price: number;
  late_cancel: boolean;
}

export interface Conversation {
  id: number;
  listing_id: number;
  listing_title: string;
  listing_photo?: string | null;
  other_user_name: string;
  other_user_id: number;
  last_message?: string | null;
  last_message_at: string;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  created_at: string;
  is_mine: boolean;
}

export interface SearchFilters {
  q?: string;
  check_in?: string;
  check_out?: string;
  adults?: number;
  children?: number;
  infants?: number;
  guests?: number;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  vibe?: string;
  amenities?: string;
  page?: number;
  page_size?: number;
}
