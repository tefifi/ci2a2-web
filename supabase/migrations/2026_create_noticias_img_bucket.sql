-- Bucket para las imágenes de noticias descargadas por el scraper de
-- UFRO Noticias (en vez de dejarlas apuntando al servidor externo de
-- fica.ufro.cl). Público de lectura porque el sitio necesita mostrarlas
-- a cualquier visitante sin login.

insert into storage.buckets (id, name, public)
values ('noticias-img', 'noticias-img', true)
on conflict (id) do nothing;

-- Lectura pública (cualquiera puede ver las imágenes del sitio)
create policy "Lectura pública de noticias-img"
  on storage.objects for select
  to public
  using (bucket_id = 'noticias-img');

-- Solo el scraper (service_role, que se salta RLS igual) y usuarios
-- autenticados (admin) pueden subir/borrar. authenticated por si en algún
-- momento se sube una imagen manualmente desde el panel admin.
create policy "Admin puede subir a noticias-img"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'noticias-img');

create policy "Admin puede borrar de noticias-img"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'noticias-img');
