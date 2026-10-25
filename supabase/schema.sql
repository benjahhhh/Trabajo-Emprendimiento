-- =====================================================================
-- KASA · Esquema de base de datos para Supabase (Postgres)
-- ---------------------------------------------------------------------
-- Cómo usarlo: Supabase → SQL Editor → New query → pega este archivo → Run
-- Después ejecuta supabase/seed.sql (datos de ejemplo de Santiago).
-- Es re-ejecutable: no borra datos de usuarios reales.
-- =====================================================================


-- =====================================================================
-- 1. TABLAS
-- =====================================================================

-- Configuración global (una sola fila). La comisión se cambia aquí.
create table if not exists public.platform_settings (
  id int primary key default 1 check (id = 1),
  commission_rate numeric(5,4) not null default 0.10
    check (commission_rate >= 0 and commission_rate < 1),
  currency text not null default 'CLP',
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

-- Perfil de cada usuario (se crea solo al registrarse)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  phone text,
  comuna text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Categorías de servicios
create table if not exists public.categories (
  id text primary key,
  name text not null,
  icon text not null,
  color text not null,
  keywords text not null default '',
  sort int not null default 0
);

-- Profesionales (perfil público). user_id = null → profesional de ejemplo (demo)
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete cascade,
  category_id text not null references public.categories (id),
  display_name text not null check (length(display_name) between 2 and 60),
  headline text not null default '',
  bio text not null default '',
  avatar_url text,
  cover_url text,
  comuna text not null default '',
  lat double precision not null,
  lng double precision not null,
  service_radius_km int not null default 10 check (service_radius_km between 1 and 100),
  price_from int not null default 0,
  years_experience int not null default 0 check (years_experience between 0 and 60),
  available boolean not null default true,
  verified boolean not null default false,
  is_demo boolean not null default false,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  jobs_count int not null default 0,
  followers_count int not null default 0,
  response_minutes int not null default 15,
  created_at timestamptz not null default now()
);
create index if not exists providers_category_idx on public.providers (category_id);

-- Datos privados del profesional (solo los ve él; el cliente recibe el
-- teléfono cuando la reserva está aceptada, vía booking_contact()).
create table if not exists public.provider_private (
  provider_id uuid primary key references public.providers (id) on delete cascade,
  phone text not null default ''
);

-- Servicios que ofrece cada profesional
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  title text not null check (length(title) between 2 and 80),
  description text not null default '',
  price int not null check (price >= 0 and price <= 100000000),
  duration_min int not null default 60 check (duration_min between 5 and 1440),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists services_provider_idx on public.services (provider_id);

-- Publicaciones (portafolio / red social de trabajos)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  image_url text not null,
  caption text not null default '',
  likes_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists posts_provider_idx on public.posts (provider_id, created_at desc);
create index if not exists posts_created_idx on public.posts (created_at desc);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Profesionales guardados / seguidos
create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, provider_id)
);

-- Reservas + pago simulado (nunca se guarda el número completo de tarjeta)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  client_id uuid references public.profiles (id) on delete cascade,
  client_name text not null default '',
  provider_id uuid not null references public.providers (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  service_title text not null,
  scheduled_at timestamptz not null,
  address text not null,
  lat double precision,
  lng double precision,
  notes text not null default '',
  price int not null check (price >= 0),
  commission_rate numeric(5,4) not null,
  commission_amount int not null,
  provider_amount int not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  payment_status text not null default 'held'
    check (payment_status in ('held', 'released', 'refunded')),
  payment_ref text not null default ('pay_' || substr(md5(gen_random_uuid()::text), 1, 16)),
  card_brand text not null default 'Tarjeta',
  card_last4 text not null default '0000' check (card_last4 ~ '^[0-9]{4}$'),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  check (is_demo or client_id is not null)
);
create index if not exists bookings_client_idx on public.bookings (client_id, created_at desc);
create index if not exists bookings_provider_idx on public.bookings (provider_id, created_at desc);

-- Reseñas
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  booking_id uuid unique references public.bookings (id) on delete set null,
  client_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  author_avatar text,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists reviews_provider_idx on public.reviews (provider_id, created_at desc);

-- Chat cliente ↔ profesional
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  last_message text not null default '',
  last_message_at timestamptz not null default now(),
  client_last_read_at timestamptz not null default now(),
  provider_last_read_at timestamptz not null default 'epoch',
  created_at timestamptz not null default now(),
  unique (client_id, provider_id)
);
create index if not exists conversations_provider_idx on public.conversations (provider_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  sender_role text not null check (sender_role in ('client', 'provider', 'system')),
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- Notificaciones dentro de la app
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);


-- =====================================================================
-- 2. FUNCIONES AUXILIARES
-- =====================================================================

-- Normaliza texto para búsquedas (minúsculas y sin tildes)
create or replace function public.norm(t text)
returns text
language sql immutable parallel safe
set search_path = public
as $$
  select translate(lower(coalesce(t, '')),
    'áàäâãéèëêíìïîóòöôõúùüûñç',
    'aaaaaeeeeiiiiooooouuuunc')
$$;

-- $15.000
create or replace function public.fmt_clp(n int)
returns text
language sql immutable
set search_path = public
as $$
  select '$' || replace(to_char(coalesce(n, 0), 'FM999,999,999,990'), ',', '.')
$$;

-- 12/10 11:00 (hora de Chile)
create or replace function public.fmt_date(ts timestamptz)
returns text
language sql stable
set search_path = public
as $$
  select to_char(ts at time zone 'America/Santiago', 'DD/MM HH24:MI')
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;

create or replace function public.notify_user(p_user uuid, p_type text, p_title text, p_body text, p_link text)
returns void
language sql security definer
set search_path = public
as $$
  insert into public.notifications (user_id, type, title, body, link)
  select p_user, p_type, p_title, coalesce(p_body, ''), p_link
  where p_user is not null
$$;

-- Mensaje de sistema en el chat de una reserva
create or replace function public.booking_system_message(p_client uuid, p_provider uuid, p_body text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_conv uuid;
begin
  if p_client is null then
    return;
  end if;
  insert into public.conversations (client_id, provider_id)
  values (p_client, p_provider)
  on conflict (client_id, provider_id) do update set last_message_at = excluded.last_message_at
  returning id into v_conv;

  insert into public.messages (conversation_id, sender_id, sender_role, body)
  values (v_conv, null, 'system', p_body);
end $$;


-- =====================================================================
-- 3. TRIGGERS
-- =====================================================================

-- Crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, 'usuario'), '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do nothing;

  insert into public.notifications (user_id, type, title, body, link)
  values (new.id, 'welcome', '¡Te damos la bienvenida!',
          'Busca un servicio y contacta al profesional más cercano o mejor valorado.', '/app');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- "Desde $X": precio mínimo de los servicios activos
create or replace function public.sync_price_from()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_provider uuid := coalesce(new.provider_id, old.provider_id);
begin
  update public.providers p
     set price_from = coalesce((select min(s.price) from public.services s
                                 where s.provider_id = v_provider and s.active), 0)
   where p.id = v_provider;
  return null;
end $$;

drop trigger if exists services_price_from on public.services;
create trigger services_price_from
  after insert or update or delete on public.services
  for each row execute function public.sync_price_from();

-- Valoración media (incremental: respeta el histórico de los perfiles demo)
create or replace function public.apply_review()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  update public.providers p
     set rating_avg = round(((p.rating_avg * p.rating_count) + new.rating) / (p.rating_count + 1), 2),
         rating_count = p.rating_count + 1
   where p.id = new.provider_id;
  return null;
end $$;

drop trigger if exists reviews_apply on public.reviews;
create trigger reviews_apply
  after insert on public.reviews
  for each row execute function public.apply_review();

-- Contador de likes
create or replace function public.sync_likes()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  else
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;

drop trigger if exists post_likes_count on public.post_likes;
create trigger post_likes_count
  after insert or delete on public.post_likes
  for each row execute function public.sync_likes();

-- Contador de seguidores (guardados)
create or replace function public.sync_followers()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.providers set followers_count = followers_count + 1 where id = new.provider_id;
  else
    update public.providers set followers_count = greatest(followers_count - 1, 0) where id = old.provider_id;
  end if;
  return null;
end $$;

drop trigger if exists favorites_count on public.favorites;
create trigger favorites_count
  after insert or delete on public.favorites
  for each row execute function public.sync_followers();

-- Último mensaje de cada conversación
create or replace function public.after_message()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  update public.conversations c
     set last_message = left(new.body, 140),
         last_message_at = new.created_at,
         client_last_read_at = case when new.sender_role = 'client' then new.created_at else c.client_last_read_at end,
         provider_last_read_at = case when new.sender_role = 'provider' then new.created_at else c.provider_last_read_at end
   where c.id = new.conversation_id;
  return null;
end $$;

drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.after_message();


-- =====================================================================
-- 4. FUNCIONES DE LA APP (RPC)
-- =====================================================================

-- Búsqueda: texto + categoría + distancia (fórmula de Haversine) + orden
drop function if exists public.search_providers(double precision, double precision, text, text, text, double precision, numeric, boolean, int);
create or replace function public.search_providers(
  p_lat double precision,
  p_lng double precision,
  p_query text default null,
  p_category text default null,
  p_sort text default 'recommended',
  p_max_km double precision default null,
  p_min_rating numeric default null,
  p_available_only boolean default false,
  p_limit int default 60
)
returns table (
  id uuid,
  display_name text,
  headline text,
  avatar_url text,
  cover_url text,
  category_id text,
  category_name text,
  comuna text,
  lat double precision,
  lng double precision,
  rating_avg numeric,
  rating_count int,
  jobs_count int,
  price_from int,
  verified boolean,
  available boolean,
  is_demo boolean,
  service_radius_km int,
  response_minutes int,
  distance_km double precision
)
language sql stable
set search_path = public
as $$
  -- Cada palabra se reduce a su raíz ("cortar" → "cort", "mecánicos" → "mecani").
  -- 1º se detecta la categoría que busca el usuario (nombre + palabras clave).
  -- Si ninguna encaja, se buscan profesionales por nombre, frase, servicios o comuna.
  with q as (
    select coalesce(array(
      select distinct case when length(w) <= 4 then w else left(w, greatest(4, length(w) - 2)) end
      from unnest(regexp_split_to_array(public.norm(coalesce(p_query, '')), '[^a-z0-9]+')) as w
      where length(w) >= 2
        and w not in ('el', 'la', 'lo', 'de', 'en', 'un', 'me', 'mi', 'tu', 'se', 'al', 'es', 'te', 'le', 'ya', 'si',
                      'no', 'su', 'yo', 'mis', 'para', 'que', 'una', 'uno', 'los', 'las', 'del', 'con', 'por', 'domicilio',
                      'servicio', 'servicios', 'casa', 'necesito', 'busco', 'alguien', 'quien', 'mas', 'cerca', 'hoy',
                      'urgente', 'barato', 'bueno', 'buena', 'mejor', 'quiero', 'favor', 'ahora', 'aqui', 'algun', 'alguna')
    ), '{}') as words
  ),
  cat_scores as (
    select c.id, (select count(*) from q, unnest(q.words) as w
                  where position(w in public.norm(c.name || ' ' || c.keywords)) > 0) as score
    from public.categories c
  ),
  cat_best as (
    select coalesce(max(score), 0) as top from cat_scores
  ),
  base as (
    select p.*, c.name as category_name,
      6371 * 2 * asin(least(1, sqrt(
        power(sin(radians(p.lat - p_lat) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(p.lat)) * power(sin(radians(p.lng - p_lng) / 2), 2)
      ))) as dist,
      public.norm(p.display_name || ' ' || p.headline || ' ' || p.bio || ' ' || p.comuna || ' ' ||
        coalesce((select string_agg(s.title || ' ' || s.description, ' ') from public.services s
                   where s.provider_id = p.id and s.active), '')) as haystack
    from public.providers p
    join public.categories c on c.id = p.category_id
    where (p_category is null or p_category = '' or p.category_id = p_category)
      and (not coalesce(p_available_only, false) or p.available)
      and (p_min_rating is null or p.rating_avg >= p_min_rating)
  ),
  scored as (
    select b.*, (select count(*) from q, unnest(q.words) as w where position(w in b.haystack) > 0) as hits
    from base b
    where (p_max_km is null or b.dist <= p_max_km)
  ),
  best as (
    select coalesce(max(hits), 0) as top from scored
  )
  select b.id, b.display_name, b.headline, b.avatar_url, b.cover_url, b.category_id, b.category_name, b.comuna,
         b.lat, b.lng, b.rating_avg, b.rating_count, b.jobs_count, b.price_from, b.verified, b.available,
         b.is_demo, b.service_radius_km, b.response_minutes, round(b.dist::numeric, 2)::double precision
  from scored b, best, q, cat_best
  where cardinality(q.words) = 0
     or (cat_best.top > 0 and b.category_id in (select cs.id from cat_scores cs where cs.score = cat_best.top))
     or (cat_best.top = 0 and best.top > 0 and b.hits = best.top)
  order by
    case when p_sort = 'distance' then b.dist end asc,
    case when p_sort = 'rating' then b.rating_avg end desc,
    case when p_sort = 'rating' then b.rating_count end desc,
    case when p_sort = 'price' then b.price_from end asc,
    case when coalesce(p_sort, 'recommended') not in ('distance', 'rating', 'price') then
      ((b.rating_avg * b.rating_count + 4.0 * 5) / (b.rating_count + 5))
      - 0.08 * b.dist
      + case when b.available then 0.15 else 0 end
      + case when b.verified then 0.10 else 0 end
    end desc,
    b.dist asc
  limit greatest(1, least(coalesce(p_limit, 60), 200))
$$;

-- Abrir (o reutilizar) el chat con un profesional
create or replace function public.start_conversation(p_provider_id uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_conv uuid;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión';
  end if;
  select user_id into v_owner from public.providers where id = p_provider_id;
  if not found then
    raise exception 'Profesional no encontrado';
  end if;
  if v_owner = v_uid then
    raise exception 'No puedes escribirte a ti mismo';
  end if;
  insert into public.conversations (client_id, provider_id)
  values (v_uid, p_provider_id)
  on conflict (client_id, provider_id) do update set client_id = excluded.client_id
  returning id into v_conv;
  return v_conv;
end $$;

-- Marcar un chat como leído
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  update public.conversations c
     set client_last_read_at = case when c.client_id = v_uid then now() else c.client_last_read_at end,
         provider_last_read_at = case when exists (select 1 from public.providers p
                                                   where p.id = c.provider_id and p.user_id = v_uid)
                                      then now() else c.provider_last_read_at end
   where c.id = p_conversation_id;
end $$;

-- Crear reserva + pago simulado. La comisión se calcula en el servidor.
create or replace function public.create_booking(
  p_service_id uuid,
  p_scheduled_at timestamptz,
  p_address text,
  p_lat double precision,
  p_lng double precision,
  p_notes text,
  p_card_brand text,
  p_card_last4 text
)
returns public.bookings
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_service public.services;
  v_provider public.providers;
  v_rate numeric;
  v_commission int;
  v_client_name text;
  v_booking public.bookings;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión para reservar';
  end if;

  select * into v_service from public.services where id = p_service_id and active;
  if not found then
    raise exception 'Este servicio ya no está disponible';
  end if;

  select * into v_provider from public.providers where id = v_service.provider_id;
  if v_provider.user_id = v_uid then
    raise exception 'No puedes contratar tu propio servicio';
  end if;
  if p_scheduled_at is null or p_scheduled_at < now() - interval '15 minutes' then
    raise exception 'Elige una fecha y hora futura';
  end if;
  if coalesce(trim(p_address), '') = '' then
    raise exception 'Indica la dirección del servicio';
  end if;
  if coalesce(p_card_last4, '') !~ '^[0-9]{4}$' then
    raise exception 'Los datos de la tarjeta no son válidos';
  end if;

  select commission_rate into v_rate from public.platform_settings where id = 1;
  v_rate := coalesce(v_rate, 0.10);
  v_commission := round(v_service.price * v_rate)::int;
  select full_name into v_client_name from public.profiles where id = v_uid;

  insert into public.bookings (
    client_id, client_name, provider_id, service_id, service_title, scheduled_at, address, lat, lng, notes,
    price, commission_rate, commission_amount, provider_amount, card_brand, card_last4
  ) values (
    v_uid, coalesce(v_client_name, ''), v_provider.id, v_service.id, v_service.title, p_scheduled_at,
    trim(p_address), p_lat, p_lng, left(coalesce(trim(p_notes), ''), 500),
    v_service.price, v_rate, v_commission, v_service.price - v_commission,
    coalesce(nullif(trim(p_card_brand), ''), 'Tarjeta'), p_card_last4
  )
  returning * into v_booking;

  perform public.booking_system_message(v_uid, v_provider.id,
    'Nueva solicitud #' || v_booking.code || ': ' || v_service.title || ' · ' ||
    public.fmt_date(p_scheduled_at) || ' · ' || public.fmt_clp(v_service.price) ||
    ' (pago retenido por la app)');

  perform public.notify_user(v_provider.user_id, 'booking_new',
    'Nueva solicitud de ' || coalesce(nullif(v_client_name, ''), 'un cliente'),
    v_service.title || ' · ' || public.fmt_date(p_scheduled_at) || ' · recibirás ' ||
    public.fmt_clp(v_booking.provider_amount),
    '/app/reservas/' || v_booking.id);

  perform public.notify_user(v_uid, 'booking_created',
    'Solicitud enviada a ' || v_provider.display_name,
    'Pagaste ' || public.fmt_clp(v_service.price) || '. El dinero queda retenido hasta que confirmes el trabajo.',
    '/app/reservas/' || v_booking.id);

  return v_booking;
end $$;

-- El profesional acepta o rechaza
create or replace function public.respond_booking(p_booking_id uuid, p_accept boolean)
returns public.bookings
language plpgsql security definer
set search_path = public
as $$
declare
  v_b public.bookings;
  v_p public.providers;
begin
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Reserva no encontrada';
  end if;
  select * into v_p from public.providers where id = v_b.provider_id;
  if v_p.user_id is null or v_p.user_id <> auth.uid() then
    raise exception 'No autorizado';
  end if;
  if v_b.status <> 'pending' then
    raise exception 'Esta solicitud ya fue respondida';
  end if;

  if p_accept then
    update public.bookings
       set status = 'accepted', accepted_at = now(), updated_at = now()
     where id = p_booking_id
    returning * into v_b;
    perform public.booking_system_message(v_b.client_id, v_b.provider_id,
      'Solicitud #' || v_b.code || ' aceptada. Ya puedes ver el teléfono de contacto en la reserva.');
    perform public.notify_user(v_b.client_id, 'booking_accepted',
      v_p.display_name || ' aceptó tu solicitud',
      v_b.service_title || ' · ' || public.fmt_date(v_b.scheduled_at),
      '/app/reservas/' || v_b.id);
  else
    update public.bookings
       set status = 'rejected', payment_status = 'refunded', cancelled_at = now(), updated_at = now()
     where id = p_booking_id
    returning * into v_b;
    perform public.booking_system_message(v_b.client_id, v_b.provider_id,
      'Solicitud #' || v_b.code || ' rechazada. Se devolvió el pago de ' || public.fmt_clp(v_b.price) || '.');
    perform public.notify_user(v_b.client_id, 'booking_rejected',
      v_p.display_name || ' no puede atenderte',
      'Te devolvimos ' || public.fmt_clp(v_b.price) || '. Prueba con otro profesional cercano.',
      '/app/reservas/' || v_b.id);
  end if;
  return v_b;
end $$;

-- Trabajo terminado: se libera el pago al profesional (menos la comisión)
create or replace function public.complete_booking(p_booking_id uuid)
returns public.bookings
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_b public.bookings;
  v_p public.providers;
  v_is_client boolean;
  v_is_provider boolean;
begin
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Reserva no encontrada';
  end if;
  select * into v_p from public.providers where id = v_b.provider_id;
  v_is_client := v_b.client_id = v_uid;
  v_is_provider := v_p.user_id is not null and v_p.user_id = v_uid;
  if not (v_is_client or v_is_provider) then
    raise exception 'No autorizado';
  end if;
  if v_b.status <> 'accepted' then
    raise exception 'Solo se puede completar una reserva aceptada';
  end if;

  update public.bookings
     set status = 'completed', payment_status = 'released', completed_at = now(), updated_at = now()
   where id = p_booking_id
  returning * into v_b;

  update public.providers set jobs_count = jobs_count + 1 where id = v_b.provider_id;

  perform public.booking_system_message(v_b.client_id, v_b.provider_id,
    'Trabajo #' || v_b.code || ' completado. Pago liberado al profesional.');

  perform public.notify_user(v_b.client_id, 'booking_completed',
    'Trabajo completado', '¿Qué tal fue con ' || v_p.display_name || '? Deja tu reseña.',
    '/app/reservas/' || v_b.id);

  perform public.notify_user(v_p.user_id, 'payout',
    'Pago liberado: ' || public.fmt_clp(v_b.provider_amount),
    v_b.service_title || ' · comisión de la app ' || public.fmt_clp(v_b.commission_amount),
    '/pro');
  return v_b;
end $$;

-- El cliente cancela (reembolso completo)
create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql security definer
set search_path = public
as $$
declare
  v_b public.bookings;
  v_p public.providers;
begin
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found or v_b.client_id is distinct from auth.uid() then
    raise exception 'Reserva no encontrada';
  end if;
  if v_b.status not in ('pending', 'accepted') then
    raise exception 'Esta reserva ya no se puede cancelar';
  end if;
  select * into v_p from public.providers where id = v_b.provider_id;

  update public.bookings
     set status = 'cancelled', payment_status = 'refunded', cancelled_at = now(), updated_at = now()
   where id = p_booking_id
  returning * into v_b;

  perform public.booking_system_message(v_b.client_id, v_b.provider_id,
    'Reserva #' || v_b.code || ' cancelada por el cliente. Pago devuelto.');
  perform public.notify_user(v_p.user_id, 'booking_cancelled',
    'Reserva cancelada', v_b.service_title || ' · ' || public.fmt_date(v_b.scheduled_at), '/pro');
  return v_b;
end $$;

-- Reseña tras completar el trabajo
create or replace function public.submit_review(p_booking_id uuid, p_rating int, p_comment text)
returns public.reviews
language plpgsql security definer
set search_path = public
as $$
declare
  v_b public.bookings;
  v_prof public.profiles;
  v_p public.providers;
  v_r public.reviews;
begin
  select * into v_b from public.bookings where id = p_booking_id;
  if not found or v_b.client_id is distinct from auth.uid() then
    raise exception 'Reserva no encontrada';
  end if;
  if v_b.status <> 'completed' then
    raise exception 'Solo puedes valorar trabajos completados';
  end if;
  if exists (select 1 from public.reviews where booking_id = p_booking_id) then
    raise exception 'Ya valoraste este trabajo';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'La valoración debe ser de 1 a 5 estrellas';
  end if;

  select * into v_prof from public.profiles where id = v_b.client_id;
  select * into v_p from public.providers where id = v_b.provider_id;

  insert into public.reviews (provider_id, booking_id, client_id, author_name, author_avatar, rating, comment)
  values (v_b.provider_id, v_b.id, v_b.client_id, coalesce(nullif(v_prof.full_name, ''), 'Cliente'),
          v_prof.avatar_url, p_rating, left(coalesce(trim(p_comment), ''), 600))
  returning * into v_r;

  perform public.notify_user(v_p.user_id, 'review',
    'Nueva reseña: ' || repeat('★', p_rating),
    coalesce(nullif(left(trim(p_comment), 90), ''), 'Un cliente valoró tu trabajo.'), '/pro');
  return v_r;
end $$;

-- Teléfono de contacto (solo con la reserva aceptada o completada)
drop function if exists public.booking_contact(uuid);
create or replace function public.booking_contact(p_booking_id uuid)
returns table (name text, phone text)
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_b public.bookings;
  v_p public.providers;
begin
  select * into v_b from public.bookings where id = p_booking_id;
  if not found then
    return;
  end if;
  select * into v_p from public.providers where id = v_b.provider_id;
  if v_b.status not in ('accepted', 'completed') then
    return;
  end if;
  if v_b.client_id = v_uid then
    return query
      select v_p.display_name,
             coalesce(nullif((select pp.phone from public.provider_private pp where pp.provider_id = v_p.id), ''),
                      (select pr.phone from public.profiles pr where pr.id = v_p.user_id), '');
  elsif v_p.user_id = v_uid then
    return query
      select coalesce(nullif(pr.full_name, ''), v_b.client_name), coalesce(pr.phone, '')
      from public.profiles pr where pr.id = v_b.client_id;
  end if;
end $$;


-- =====================================================================
-- 5. MODO DEMO (profesionales de ejemplo que responden solos)
-- =====================================================================

-- Un profesional de ejemplo acepta la solicitud (la app lo llama a los pocos segundos)
create or replace function public.demo_accept_booking(p_booking_id uuid)
returns public.bookings
language plpgsql security definer
set search_path = public
as $$
declare
  v_b public.bookings;
  v_p public.providers;
  v_first text;
begin
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found or v_b.client_id is distinct from auth.uid() then
    raise exception 'Reserva no encontrada';
  end if;
  select * into v_p from public.providers where id = v_b.provider_id;
  if v_p.user_id is not null or not v_p.is_demo or v_b.status <> 'pending' then
    return v_b;
  end if;

  update public.bookings
     set status = 'accepted', accepted_at = now(), updated_at = now()
   where id = p_booking_id
  returning * into v_b;

  v_first := split_part(trim(v_b.client_name), ' ', 1);

  perform public.booking_system_message(v_b.client_id, v_b.provider_id,
    'Solicitud #' || v_b.code || ' aceptada. Ya puedes ver el teléfono de contacto en la reserva.');

  insert into public.messages (conversation_id, sender_id, sender_role, body)
  select c.id, null, 'provider',
         case when v_first = '' then '¡Hola!' else '¡Hola ' || initcap(v_first) || '!' end ||
         ' Confirmado para el ' || public.fmt_date(v_b.scheduled_at) ||
         '. Llego a la dirección que indicaste. Cualquier cosa me escribes por aquí 👍'
  from public.conversations c
  where c.client_id = v_b.client_id and c.provider_id = v_b.provider_id;

  perform public.notify_user(v_b.client_id, 'booking_accepted',
    v_p.display_name || ' aceptó tu solicitud',
    v_b.service_title || ' · ' || public.fmt_date(v_b.scheduled_at),
    '/app/reservas/' || v_b.id);
  return v_b;
end $$;

-- Respuesta automática de un profesional de ejemplo en el chat
create or replace function public.demo_reply(p_conversation_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_c public.conversations;
  v_p public.providers;
  v_last text;
  v_replies text[] := array[
    '¡Hola! Sí, sin problema. ¿Te acomoda el horario que elegiste?',
    'Perfecto, lo tengo anotado. Llevo todo lo necesario para el trabajo.',
    'Claro que sí. Cualquier detalle extra me lo cuentas por aquí.',
    'Genial, gracias por avisar. Te escribo cuando vaya en camino 🚗',
    'Dale. Si prefieres otro día, puedes reservar otra hora desde mi perfil.',
    'Sin problema, el precio incluye el traslado a tu domicilio.'
  ];
begin
  select * into v_c from public.conversations where id = p_conversation_id;
  if not found or v_c.client_id is distinct from auth.uid() then
    return;
  end if;
  select * into v_p from public.providers where id = v_c.provider_id;
  if v_p.user_id is not null or not v_p.is_demo then
    return;
  end if;
  select sender_role into v_last from public.messages
   where conversation_id = p_conversation_id order by created_at desc limit 1;
  if v_last is distinct from 'client' then
    return;
  end if;
  insert into public.messages (conversation_id, sender_id, sender_role, body)
  values (p_conversation_id, null, 'provider', v_replies[1 + floor(random() * array_length(v_replies, 1))::int]);
end $$;


-- =====================================================================
-- 6. PANEL DE NEGOCIO
-- Métricas agregadas (sin datos personales): visibles para usuarios con sesión.
-- Cambiar comisión o datos demo: solo administradores (profiles.is_admin).
-- =====================================================================

create or replace function public.platform_stats()
returns json
language plpgsql security definer
set search_path = public
as $$
declare
  v json;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión';
  end if;

  select json_build_object(
    'commission_rate', (select commission_rate from public.platform_settings where id = 1),
    'gmv', coalesce(sum(b.price) filter (where b.status in ('pending', 'accepted', 'completed')), 0),
    'gmv_completed', coalesce(sum(b.price) filter (where b.status = 'completed'), 0),
    'commission_earned', coalesce(sum(b.commission_amount) filter (where b.status = 'completed'), 0),
    'commission_pending', coalesce(sum(b.commission_amount) filter (where b.status in ('pending', 'accepted')), 0),
    'paid_to_providers', coalesce(sum(b.provider_amount) filter (where b.status = 'completed'), 0),
    'refunded', coalesce(sum(b.price) filter (where b.payment_status = 'refunded'), 0),
    'bookings_total', count(*),
    'bookings_completed', count(*) filter (where b.status = 'completed'),
    'bookings_active', count(*) filter (where b.status in ('pending', 'accepted')),
    'bookings_cancelled', count(*) filter (where b.status in ('cancelled', 'rejected')),
    'avg_ticket', coalesce(round(avg(b.price) filter (where b.status = 'completed')), 0),
    'users', (select count(*) from public.profiles),
    'providers', (select count(*) from public.providers),
    'real_providers', (select count(*) from public.providers where user_id is not null),
    'reviews', (select count(*) from public.reviews),
    'by_category', coalesce((
      select json_agg(x order by x.gmv desc) from (
        select c.id, c.name, c.color,
               count(bb.id) filter (where bb.status = 'completed') as bookings,
               coalesce(sum(bb.price) filter (where bb.status = 'completed'), 0) as gmv,
               coalesce(sum(bb.commission_amount) filter (where bb.status = 'completed'), 0) as commission
        from public.categories c
        left join public.providers pp on pp.category_id = c.id
        left join public.bookings bb on bb.provider_id = pp.id
        group by c.id, c.name, c.color
      ) x
    ), '[]'::json),
    'daily', coalesce((
      select json_agg(d order by d.day) from (
        select to_char(g.day, 'YYYY-MM-DD') as day,
               count(bb.id) as bookings,
               coalesce(sum(bb.price), 0) as gmv,
               coalesce(sum(bb.commission_amount), 0) as commission
        from generate_series(
               ((now() at time zone 'America/Santiago')::date - 13)::timestamp,
               ((now() at time zone 'America/Santiago')::date)::timestamp, interval '1 day') as g(day)
        left join public.bookings bb
          on (bb.completed_at at time zone 'America/Santiago')::date = g.day::date
         and bb.status = 'completed'
        group by g.day
      ) d
    ), '[]'::json)
  ) into v
  from public.bookings b;

  return v;
end $$;

create or replace function public.admin_set_commission(p_rate numeric)
returns numeric
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;
  if p_rate is null or p_rate < 0 or p_rate >= 0.5 then
    raise exception 'La comisión debe estar entre 0%% y 50%%';
  end if;
  update public.platform_settings set commission_rate = p_rate, updated_at = now() where id = 1;
  return p_rate;
end $$;

-- Trae al presente las reservas históricas de ejemplo (para que las gráficas se vean al día)
create or replace function public.admin_refresh_demo()
returns int
language plpgsql security definer
set search_path = public
as $$
declare
  v_delta interval;
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;
  select now() - max(completed_at) - interval '2 hours' into v_delta
  from public.bookings where is_demo and status = 'completed';
  if v_delta is null or v_delta < interval '1 hour' then
    return 0;
  end if;
  update public.bookings
     set scheduled_at = scheduled_at + v_delta,
         created_at = created_at + v_delta,
         updated_at = updated_at + v_delta,
         accepted_at = accepted_at + v_delta,
         completed_at = completed_at + v_delta,
         cancelled_at = cancelled_at + v_delta
   where is_demo;
  get diagnostics v_count = row_count;
  update public.posts set created_at = created_at + v_delta
   where provider_id in (select id from public.providers where is_demo);
  update public.reviews set created_at = created_at + v_delta
   where booking_id is null and provider_id in (select id from public.providers where is_demo);
  return v_count;
end $$;

-- Mueve los profesionales de ejemplo alrededor de un punto (para presentar en otra ciudad)
create or replace function public.relocate_demo_providers(p_lat double precision, p_lng double precision)
returns int
language plpgsql security definer
set search_path = public
as $$
declare
  v_lat double precision;
  v_lng double precision;
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;
  select avg(lat), avg(lng) into v_lat, v_lng from public.providers where is_demo;
  if v_lat is null then
    return 0;
  end if;
  update public.providers
     set lat = p_lat + (lat - v_lat),
         lng = p_lng + (lng - v_lng)
   where is_demo;
  get diagnostics v_count = row_count;
  return v_count;
end $$;


-- =====================================================================
-- 7. SEGURIDAD: RLS (Row Level Security)
-- =====================================================================

alter table public.platform_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.providers enable row level security;
alter table public.provider_private enable row level security;
alter table public.services enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.favorites enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Configuración: lectura pública
drop policy if exists settings_read on public.platform_settings;
create policy settings_read on public.platform_settings for select using (true);

-- Perfiles: el propio + los clientes que te han escrito (si eres profesional)
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (
  id = (select auth.uid())
  or exists (
    select 1 from public.conversations c
    join public.providers p on p.id = c.provider_id
    where c.client_id = profiles.id and p.user_id = (select auth.uid())
  )
);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Categorías, profesionales, publicaciones y reseñas: lectura pública
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select using (true);

drop policy if exists providers_read on public.providers;
create policy providers_read on public.providers for select using (true);
drop policy if exists providers_insert on public.providers;
create policy providers_insert on public.providers for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists providers_update on public.providers;
create policy providers_update on public.providers for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists provider_private_owner on public.provider_private;
create policy provider_private_owner on public.provider_private for all to authenticated
  using (exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid())));

drop policy if exists services_read on public.services;
create policy services_read on public.services for select using (
  active or exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid()))
);
drop policy if exists services_write on public.services;
create policy services_write on public.services for all to authenticated
  using (exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid())));

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select using (true);
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert to authenticated
  with check (exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid())));
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update to authenticated
  using (exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid())));
drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete to authenticated
  using (exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid())));

drop policy if exists likes_read on public.post_likes;
create policy likes_read on public.post_likes for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists likes_insert on public.post_likes;
create policy likes_insert on public.post_likes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists likes_delete on public.post_likes;
create policy likes_delete on public.post_likes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists favorites_read on public.favorites;
create policy favorites_read on public.favorites for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists favorites_insert on public.favorites;
create policy favorites_insert on public.favorites for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists favorites_delete on public.favorites;
create policy favorites_delete on public.favorites for delete to authenticated using (user_id = (select auth.uid()));

-- Reservas: solo el cliente y el profesional. Se crean/modifican con las funciones RPC.
drop policy if exists bookings_read on public.bookings;
create policy bookings_read on public.bookings for select to authenticated using (
  client_id = (select auth.uid())
  or exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid()))
);

drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select using (true);

drop policy if exists conversations_read on public.conversations;
create policy conversations_read on public.conversations for select to authenticated using (
  client_id = (select auth.uid())
  or exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid()))
);

drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.client_id = (select auth.uid())
           or exists (select 1 from public.providers p where p.id = c.provider_id and p.user_id = (select auth.uid())))
  )
);
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid())
  and (
    (sender_role = 'client' and exists (
      select 1 from public.conversations c where c.id = conversation_id and c.client_id = (select auth.uid())))
    or (sender_role = 'provider' and exists (
      select 1 from public.conversations c join public.providers p on p.id = c.provider_id
      where c.id = conversation_id and p.user_id = (select auth.uid())))
  )
);

drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));


-- =====================================================================
-- 8. PERMISOS (explícitos, no dependen de los permisos por defecto)
-- =====================================================================

grant usage on schema public to anon, authenticated;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant select on public.platform_settings, public.categories, public.providers, public.services,
                public.posts, public.reviews to anon, authenticated;
grant select on public.profiles, public.provider_private, public.post_likes, public.favorites,
                public.bookings, public.conversations, public.messages, public.notifications to authenticated;

grant update (full_name, avatar_url, phone, comuna) on public.profiles to authenticated;
grant insert (user_id, category_id, display_name, headline, bio, avatar_url, cover_url, comuna, lat, lng,
              service_radius_km, years_experience, available) on public.providers to authenticated;
grant update (category_id, display_name, headline, bio, avatar_url, cover_url, comuna, lat, lng,
              service_radius_km, years_experience, available) on public.providers to authenticated;
grant insert, update on public.provider_private to authenticated;
grant insert, update, delete on public.services to authenticated;
grant insert, delete on public.posts to authenticated;
grant update (caption) on public.posts to authenticated;
grant insert, delete on public.post_likes to authenticated;
grant insert, delete on public.favorites to authenticated;
grant insert on public.messages to authenticated;
grant update (read) on public.notifications to authenticated;
grant delete on public.notifications to authenticated;

grant execute on function public.norm(text) to anon, authenticated;
grant execute on function public.fmt_clp(int) to anon, authenticated;
grant execute on function public.fmt_date(timestamptz) to anon, authenticated;
grant execute on function public.search_providers(double precision, double precision, text, text, text,
                                                  double precision, numeric, boolean, int) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.start_conversation(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.create_booking(uuid, timestamptz, text, double precision, double precision,
                                                text, text, text) to authenticated;
grant execute on function public.respond_booking(uuid, boolean) to authenticated;
grant execute on function public.complete_booking(uuid) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.submit_review(uuid, int, text) to authenticated;
grant execute on function public.booking_contact(uuid) to authenticated;
grant execute on function public.demo_accept_booking(uuid) to authenticated;
grant execute on function public.demo_reply(uuid) to authenticated;
grant execute on function public.platform_stats() to authenticated;
grant execute on function public.admin_set_commission(numeric) to authenticated;
grant execute on function public.admin_refresh_demo() to authenticated;
grant execute on function public.relocate_demo_providers(double precision, double precision) to authenticated;


-- =====================================================================
-- 9. STORAGE (fotos de perfil y publicaciones)
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media_insert_own_folder" on storage.objects;
create policy "media_insert_own_folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "media_update_own_folder" on storage.objects;
create policy "media_update_own_folder" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "media_delete_own_folder" on storage.objects;
create policy "media_delete_own_folder" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);


-- =====================================================================
-- 10. REALTIME (chat, notificaciones y reservas en vivo)
-- =====================================================================

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['messages', 'notifications', 'bookings', 'conversations'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
