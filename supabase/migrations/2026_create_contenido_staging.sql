-- Tabla única de bandeja de revisión para todo lo que traen los scrapers
-- (ORCID, UFRO Noticias, Google Scholar). El admin aprueba/rechaza desde
-- AdminRevision.jsx; solo al aprobar se copia el contenido a la tabla
-- pública real (noticias / publicaciones / biblioteca / colaboradores).

create table if not exists contenido_staging (
  id             uuid primary key default gen_random_uuid(),
  tipo           text not null check (tipo in ('noticia','publicacion','biblioteca','colaborador')),
  fuente         text not null,              -- 'ufro_noticias' | 'orcid' | 'google_scholar'
  fuente_id      text not null,              -- id/URL externo, para deduplicar entre corridas
  estado         text not null default 'pendiente' check (estado in ('pendiente','aprobado','rechazado')),
  payload        jsonb not null,             -- datos ya mapeados al shape de la tabla destino
  colaborador_id bigint references colaboradores(id) on delete set null,
  creado_en      timestamptz not null default now(),
  revisado_en    timestamptz,
  revisado_por   text
);

-- Evita que el mismo item se vuelva a insertar en cada corrida del cron
create unique index if not exists contenido_staging_dedup
  on contenido_staging (tipo, fuente, fuente_id);

-- Consulta más común del admin: "dame lo pendiente de tal tipo, lo más nuevo primero"
create index if not exists contenido_staging_estado_tipo
  on contenido_staging (estado, tipo, creado_en desc);

-- RLS: solo un usuario autenticado (admin) puede leer/escribir esta tabla
-- desde el navegador. Los scrapers usan la service_role key, que se salta
-- RLS por diseño, así que no necesitan policy propia.
alter table contenido_staging enable row level security;

create policy "Admin puede leer staging"
  on contenido_staging for select
  to authenticated
  using (true);

create policy "Admin puede actualizar staging"
  on contenido_staging for update
  to authenticated
  using (true);

create policy "Admin puede borrar staging"
  on contenido_staging for delete
  to authenticated
  using (true);
