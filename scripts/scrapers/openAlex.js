// scripts/scrapers/openAlex.js
//
// Reemplaza al scraper de Google Scholar (bloqueaba las requests
// automatizadas desde el primer intento — ver notas en googleScholar.js).
//
// OpenAlex es una API pública real (sin API key, sin bloqueos) que indexa
// más de 250 millones de trabajos académicos. Se busca directamente por
// ORCID — el mismo dato que ya usa el scraper de orcid.js — en vez de por
// nombre, lo que evita el problema de confundir personas con nombres
// parecidos.
//
// Uso:
//   node scripts/scrapers/openAlex.js --dry-run
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/scrapers/openAlex.js

import { insertStaging, getColaboradoresConIdentificador } from './_supabaseStaging.js';
import { pareceRelevante } from './_relevancia.js';

const DRY_RUN = process.argv.includes('--dry-run');
const OPENALEX_API = 'https://api.openalex.org/works';

// OpenAlex pide (opcionalmente pero recomendado) un email de contacto en
// la query para entrar al "polite pool" — respuestas más rápidas y
// confiables. Cambia esto por un correo real del centro si tienes uno.
const CONTACTO = 'contacto.ci2a2@ufrontera.cl';

function extraerIdOrcid(valorGuardado) {
  // Igual que en orcid.js: acepta el ID solo o la URL completa de ORCID.
  const match = valorGuardado.match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/);
  return match ? match[1] : valorGuardado.trim();
}

async function buscarPorOrcid(orcidId) {
  const url = `${OPENALEX_API}?filter=author.orcid:${orcidId}&per-page=50&mailto=${CONTACTO}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenAlex ORCID ${orcidId}: HTTP ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

/**
 * Trae las áreas de investigación del autor directamente desde el perfil
 * de OpenAlex (no de sus publicaciones una por una) — OpenAlex ya infiere
 * los "conceptos" principales de cada autor a partir de todo su historial.
 * Devuelve un string con los 3 más relevantes, o null si no hay nada.
 */
async function fetchAreaInvestigacion(orcidId) {
  const url = `https://api.openalex.org/authors?filter=orcid:${orcidId}&mailto=${CONTACTO}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const autor = data.results?.[0];
  if (!autor) return null;

  const conceptos = autor.x_concepts ?? [];
  const top = conceptos
    .slice() // no mutar el array original
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
    .map((c) => c.display_name);

  return top.length > 0 ? top.join(', ') : null;
}

function extraerResumen(work) {
  return {
    fuente_id: work.id, // URL tipo https://openalex.org/W... — única por trabajo
    titulo: work.title || work.display_name || '(sin título)',
    year: work.publication_year ?? null,
    url:
      work.primary_location?.landing_page_url ||
      (work.doi ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}` : null) ||
      work.id,
    // OpenAlex indica si hay una versión de acceso abierto y su URL directa
    // (a veces el PDF, a veces la página del repositorio) — se usa para
    // alimentar la Biblioteca, aparte de la Publicación.
    urlAccesoAbierto: work.open_access?.is_oa ? work.open_access?.oa_url : null,
  };
}

async function main() {
  const colaboradores = await getColaboradoresConIdentificador('orcid');
  console.log(`Colaboradores con ORCID: ${colaboradores.length}`);

  let nuevos = 0;
  let vistos = 0;
  let fallidos = 0;

  for (const colaborador of colaboradores) {
    try {
      const orcidId = extraerIdOrcid(colaborador.orcid);
      const works = await buscarPorOrcid(orcidId);
      console.log(`${colaborador.nombre}: ${works.length} trabajos en OpenAlex.`);

      for (const work of works) {
        const resumen = extraerResumen(work);
        vistos++;

        if (DRY_RUN) continue;

        const { inserted, error } = await insertStaging({
          tipo: 'publicacion',
          fuente: 'openalex',
          fuente_id: resumen.fuente_id,
          colaborador_id: colaborador.id,
          payload: {
            titulo: resumen.titulo,
            year: resumen.year,
            autores: colaborador.nombre,
            url: resumen.url,
            relevante_ia: pareceRelevante(resumen.titulo),
          },
        });

        if (error) {
          console.error(`  Error insertando ${resumen.fuente_id}:`, error.message);
          fallidos++;
        } else if (inserted) {
          nuevos++;
        }

        // Si hay versión de acceso abierto, además se ofrece como item de
        // Biblioteca (documento descargable), aparte de la Publicación.
        if (resumen.urlAccesoAbierto) {
          const { inserted: insertedBib, error: errorBib } = await insertStaging({
            tipo: 'biblioteca',
            fuente: 'openalex',
            fuente_id: `${resumen.fuente_id}-oa`,
            colaborador_id: colaborador.id,
            payload: {
              titulo: resumen.titulo,
              url: resumen.urlAccesoAbierto,
              tipo: 'pdf',
              autor: colaborador.nombre,
              relevante_ia: pareceRelevante(resumen.titulo),
            },
          });
          if (errorBib) {
            console.error(`  Error insertando biblioteca ${resumen.fuente_id}:`, errorBib.message);
            fallidos++;
          } else if (insertedBib) {
            nuevos++;
          }
        }
      }
    } catch (err) {
      console.error(`Error con ${colaborador.nombre}:`, err.message);
      fallidos++;
    }

    // Área de investigación (perfil), aparte del loop de publicaciones.
    // Igual que el perfil de orcid.js, se re-genera una vez al mes para
    // permitir actualizaciones (el índice único bloquearía un segundo
    // intento con el mismo fuente_id).
    try {
      const orcidId = extraerIdOrcid(colaborador.orcid);
      const area = await fetchAreaInvestigacion(orcidId);
      if (area && !DRY_RUN) {
        const mesActual = new Date().toISOString().slice(0, 7);
        const { inserted, error } = await insertStaging({
          tipo: 'colaborador',
          fuente: 'openalex',
          fuente_id: `area-${orcidId}-${mesActual}`,
          colaborador_id: colaborador.id,
          payload: {
            titulo: colaborador.nombre, // solo para mostrar en la bandeja, no se guarda
            area_investigacion: area,
          },
        });
        if (error) {
          console.error(`  Error insertando área de ${colaborador.nombre}:`, error.message);
          fallidos++;
        } else if (inserted) {
          nuevos++;
        }
      }
    } catch (err) {
      console.error(`  Error trayendo área de investigación de ${colaborador.nombre}:`, err.message);
    }
  }

  if (DRY_RUN) {
    console.log(`--dry-run: no se escribió en Supabase. Trabajos vistos: ${vistos}`);
  } else {
    console.log(`Listo. Vistos: ${vistos} | Nuevos en staging: ${nuevos} | Fallidos: ${fallidos}`);

    // Igual que en orcid.js: si fallaron todos los colaboradores, es un
    // problema sistémico (API de OpenAlex caída, credenciales inválidas),
    // no algo para solo dejar en el log.
    if (colaboradores.length > 0 && fallidos >= colaboradores.length) {
      throw new Error('Fallaron todos los colaboradores — revisa la API de OpenAlex o las credenciales.');
    }
  }
}

main().catch((err) => {
  console.error('Fallo general del scraper OpenAlex:', err);
  process.exit(1);
});