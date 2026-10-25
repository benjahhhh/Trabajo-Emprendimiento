export type Category = {
  id: string
  name: string
  icon: string
  color: string
  keywords: string
  sort: number
}

export type Profile = {
  id: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  comuna: string | null
  is_admin: boolean
  created_at: string
}

export type Provider = {
  id: string
  user_id: string | null
  category_id: string
  display_name: string
  headline: string
  bio: string
  avatar_url: string | null
  cover_url: string | null
  comuna: string
  lat: number
  lng: number
  service_radius_km: number
  price_from: number
  years_experience: number
  available: boolean
  verified: boolean
  is_demo: boolean
  rating_avg: number
  rating_count: number
  jobs_count: number
  followers_count: number
  response_minutes: number
  created_at: string
}

export type ProviderResult = Pick<
  Provider,
  | 'id'
  | 'display_name'
  | 'headline'
  | 'avatar_url'
  | 'cover_url'
  | 'category_id'
  | 'comuna'
  | 'lat'
  | 'lng'
  | 'rating_avg'
  | 'rating_count'
  | 'jobs_count'
  | 'price_from'
  | 'verified'
  | 'available'
  | 'is_demo'
  | 'service_radius_km'
  | 'response_minutes'
> & { category_name: string; distance_km: number }

export type Service = {
  id: string
  provider_id: string
  title: string
  description: string
  price: number
  duration_min: number
  active: boolean
  created_at: string
}

export type Post = {
  id: string
  provider_id: string
  image_url: string
  caption: string
  likes_count: number
  created_at: string
  provider?: Pick<Provider, 'id' | 'display_name' | 'avatar_url' | 'category_id' | 'comuna' | 'verified'>
}

export type Review = {
  id: string
  provider_id: string
  booking_id: string | null
  client_id: string | null
  author_name: string
  author_avatar: string | null
  rating: number
  comment: string
  created_at: string
}

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'

export type Booking = {
  id: string
  code: string
  client_id: string | null
  client_name: string
  provider_id: string
  service_id: string | null
  service_title: string
  scheduled_at: string
  address: string
  lat: number | null
  lng: number | null
  notes: string
  price: number
  commission_rate: number
  commission_amount: number
  provider_amount: number
  status: BookingStatus
  payment_status: 'held' | 'released' | 'refunded'
  payment_ref: string
  card_brand: string
  card_last4: string
  is_demo: boolean
  created_at: string
  updated_at: string
  accepted_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  provider?: Pick<Provider, 'id' | 'display_name' | 'avatar_url' | 'category_id' | 'is_demo' | 'user_id' | 'comuna'>
}

export type Conversation = {
  id: string
  client_id: string
  provider_id: string
  last_message: string
  last_message_at: string
  client_last_read_at: string
  provider_last_read_at: string
  created_at: string
  provider?: Pick<Provider, 'id' | 'display_name' | 'avatar_url' | 'is_demo' | 'user_id' | 'category_id'>
  client?: Pick<Profile, 'full_name' | 'avatar_url'> | null
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_role: 'client' | 'provider' | 'system'
  body: string
  created_at: string
}

export type AppNotification = {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  created_at: string
}

export type PlatformStats = {
  commission_rate: number
  gmv: number
  gmv_completed: number
  commission_earned: number
  commission_pending: number
  paid_to_providers: number
  refunded: number
  bookings_total: number
  bookings_completed: number
  bookings_active: number
  bookings_cancelled: number
  avg_ticket: number
  users: number
  providers: number
  real_providers: number
  reviews: number
  by_category: { id: string; name: string; color: string; bookings: number; gmv: number; commission: number }[]
  daily: { day: string; bookings: number; gmv: number; commission: number }[]
}
