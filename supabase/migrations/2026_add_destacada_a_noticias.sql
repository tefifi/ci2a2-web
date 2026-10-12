-- La página de inicio (src/pages/index.astro) siempre esperó una columna
-- "destacada" en noticias para decidir cuáles mostrar primero en el
-- carrusel del home, pero la columna nunca se creó — la query fallaba
-- silenciosamente y el sitio siempre caía al fallback de "más recientes".

alter table noticias
  add column if not exists destacada boolean not null default false;
