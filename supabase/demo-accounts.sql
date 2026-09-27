-- =====================================================================
-- CERCA · Cuentas demo para la presentación
-- 1) Crea en la app (Registro) estas dos cuentas con contraseña cerca-demo-2026:
--      cliente.demo@example.com       (cliente, además admin del panel de negocio)
--      profesional.demo@example.com   (profesional real que recibe solicitudes)
-- 2) Ejecuta este archivo en Supabase → SQL Editor.
-- =====================================================================

do $$
declare
  v_client uuid := (select id from auth.users where email = 'cliente.demo@example.com');
  v_pro uuid := (select id from auth.users where email = 'profesional.demo@example.com');
  v_provider uuid;
begin
  if v_client is null or v_pro is null then
    raise exception 'Primero crea las dos cuentas demo desde la app';
  end if;

  update public.profiles
     set full_name = 'Martina López', phone = '+56 9 8765 4321', comuna = 'Providencia', is_admin = true,
         avatar_url = 'https://randomuser.me/api/portraits/women/44.jpg'
   where id = v_client;

  update public.profiles
     set full_name = 'Sebastián Muñoz', phone = '+56 9 5555 1212', comuna = 'Ñuñoa',
         avatar_url = 'https://randomuser.me/api/portraits/men/75.jpg'
   where id = v_pro;

  insert into public.providers (user_id, category_id, display_name, headline, bio, avatar_url, cover_url, comuna, lat, lng,
                                service_radius_km, years_experience, available, verified, response_minutes)
  values (v_pro, 'barberia', 'Seba Barber', 'Barbero a domicilio · Ñuñoa y Providencia',
          'Barbero hace 6 años. Voy a tu casa u oficina con sillón plegable y todo desinfectado. Fades, clásicos y barba con toalla caliente.',
          'https://randomuser.me/api/portraits/men/75.jpg',
          'https://images.unsplash.com/photo-1635273051937-a0ddef9573b6',
          'Ñuñoa', -33.4541, -70.6046, 12, 6, true, true, 5)
  on conflict (user_id) do update set category_id = excluded.category_id, display_name = excluded.display_name,
    headline = excluded.headline, bio = excluded.bio, avatar_url = excluded.avatar_url, cover_url = excluded.cover_url,
    comuna = excluded.comuna, lat = excluded.lat, lng = excluded.lng, verified = true
  returning id into v_provider;

  insert into public.provider_private (provider_id, phone) values (v_provider, '+56 9 5555 1212')
  on conflict (provider_id) do update set phone = excluded.phone;

  if not exists (select 1 from public.services where provider_id = v_provider) then
    insert into public.services (provider_id, title, description, price, duration_min) values
      (v_provider, 'Corte a domicilio', 'Máquina y tijera, lavado incluido.', 12000, 45),
      (v_provider, 'Corte + barba', 'Corte completo y perfilado con toalla caliente.', 17000, 60),
      (v_provider, 'Perfilado de barba', 'Navaja, perfilado y bálsamo.', 8000, 25);
  end if;

  if not exists (select 1 from public.posts where provider_id = v_provider) then
    insert into public.posts (provider_id, image_url, caption, likes_count, created_at) values
      (v_provider, 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a', 'Fade con navaja recién terminado 💈', 184, now() - interval '5 hours'),
      (v_provider, 'https://images.unsplash.com/photo-1599011176306-4a96f1516d4d', 'Perfilado de barba en Providencia', 97, now() - interval '2 days'),
      (v_provider, 'https://images.unsplash.com/photo-1605497788044-5a32c7078486', 'Corte clásico para una entrevista de trabajo', 142, now() - interval '6 days');
  end if;

  if not exists (select 1 from public.reviews where provider_id = v_provider) then
    insert into public.reviews (provider_id, author_name, author_avatar, rating, comment, created_at) values
      (v_provider, 'Tomás R.', 'https://randomuser.me/api/portraits/men/12.jpg', 5, 'Llegó puntual y el fade quedó perfecto. Lo recomiendo.', now() - interval '3 days'),
      (v_provider, 'Diego M.', null, 5, 'Me cortó el pelo en la oficina en 30 minutos. Excelente.', now() - interval '9 days'),
      (v_provider, 'Felipe A.', 'https://randomuser.me/api/portraits/men/41.jpg', 4, 'Muy buen corte, se demoró un poco en llegar.', now() - interval '15 days');
  end if;

  update public.providers
     set rating_avg = 4.9, rating_count = 64, jobs_count = 97, followers_count = 530
   where id = v_provider;
end $$;
