// scripts/scrapers/orcid.js
//
// Recorre los colaboradores que tienen ORCID registrado, trae sus
// publicaciones vía la API pública de ORCID (no requiere API key) y
// las deja en contenido_staging con estado 'pendiente' para que el
// admin las revise antes de publicarlas.
//
// Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/scrapers/orcid.js
//
// Pensado para correr por cron (ej. GitHub Actions, 1 vez por semana).

import { insertStaging, getColaboradoresConIdentificador } from './_supabaseStaging.js';
import { pareceRelevante } from './_relevancia.js';

const ORCID_API = 'https://pub.orcid.org/v3.0';

async function fetchWorksSummary(orcidId) {
  const idLimpio = orcidId.trim();
  const res = await fetch(`${ORCID_API}/${idLimpio}/works`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`ORCID ${idLimpio}: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.group ?? [];
}

/**
 * Trae biografía y afiliación institucional actual desde ORCID, para
 * generar una actualización de perfil (no una publicación). Devuelve null
 * si no hay nada útil que actualizar.
 */
async function fetchPerfil(orcidId) {
  const idLimpio = orcidId.trim();

  const [resPersona, resEmpleos] = await Promise.all([
    fetch(`${ORCID_API}/${idLimpio}/person`, { headers: { Accept: 'application/json' } }),
    fetch(`${ORCID_API}/${idLimpio}/employments`, { headers: { Accept: 'application/json' } }),
  ]);

  const persona = resPersona.ok ? await resPersona.json() : null;
  const empleos = resEmpleos.ok ? await resEmpleos.json() : null;

  const bio = persona?.biography?.content || null;

  // Toma el primer empleo sin fecha de término (afiliación actual).
  const grupoActual = empleos?.['affiliation-group']?.find((g) =>
    g.summaries?.some((s) => !s['employment-summary']?.['end-date'])
  );
  const resumenEmpleo = grupoActual?.summaries?.[0]?.['employment-summary'];

  const institucion = resumenEmpleo?.organization?.name || null;
  const cargo = resumenEmpleo?.['role-title'] || null;

  if (!bio && !institucion && !cargo) return null;

  return { bio, institucion, cargo };
}

// Cada "group" de ORCID puede tener varias versiones (traducciones,
// duplicados reportados por distintas fuentes) — tomamos la primera
// como representativa.
function extraerResumen(group) {
  const summary = group['work-summary']?.[0];
  if (!summary) return null;

  return {
    fuente_id: String(summary['put-code']),
    titulo: summary.title?.title?.value ?? '(sin título)',
    anio: summary['publication-date']?.year?.value
      ? Number(summary['publication-date'].year.value)
      : null,
    tipo_publicacion: summary.type ?? null,
    url:
      summary.url?.value ??
      (summary['external-ids']?.['external-id']?.find(
        (e) => e['external-id-type'] === 'doi'
      )
        ? `https://doi.org/${
            summary['external-ids']['external-id'].find(
              (e) => e['external-id-type'] === 'doi'
            )['external-id-value']
          }`
        : null),
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
      const groups = await fetchWorksSummary(colaborador.orcid);

      for (const group of groups) {
        const resumen = extraerResumen(group);
        if (!resumen) continue;

        // No se descarta nada por año — todo llega a staging. Solo se marca
        // si parece relacionado a las líneas de investigación del centro,
        // para que se pueda priorizar/ordenar la revisión en el admin.
        const relevante = pareceRelevante(resumen.titulo);

        vistos++;

        const { inserted, error } = await insertStaging({
          tipo: 'publicacion',
          fuente: 'orcid',
          fuente_id: resumen.fuente_id,
          colaborador_id: colaborador.id,
          payload: {
            titulo: resumen.titulo,
            year: resumen.anio,
            autores: colaborador.nombre,
            url: resumen.url,
            tipo_publicacion: resumen.tipo_publicacion,
            relevante_ia: relevante,
          },
        });

        if (error) {
          console.error(`  Error insertando ${resumen.fuente_id}:`, error.message);
          fallidos++;
        } else if (inserted) {
          nuevos++;
        }
      }

      // Pequeña pausa entre colaboradores para no golpear la API de golpe.
      await new Promise((r) => setTimeout(r, 300));

      // Actualización de perfil (bio/institución/cargo) — item aparte del
      // tipo 'colaborador', que en el admin se aplica como UPDATE en vez
      // de crear un registro nuevo. fuente_id incluye el año-mes para que
      // se genere un nuevo pendiente de revisión una vez al mes (si no,
      // el índice único de staging bloquearía cualquier actualización
      // futura después de la primera vez).
      const perfil = await fetchPerfil(colaborador.orcid);
      if (perfil) {
        const mesActual = new Date().toISOString().slice(0, 7); // "2026-08"
        const { inserted, error } = await insertStaging({
          tipo: 'colaborador',
          fuente: 'orcid',
          fuente_id: `perfil-${colaborador.orcid.trim()}-${mesActual}`,
          colaborador_id: colaborador.id,
          payload: {
            titulo: colaborador.nombre, // solo para mostrar en la bandeja de revisión, no se guarda
            bio: perfil.bio,
            institucion: perfil.institucion,
            cargo: perfil.cargo,
          },
        });
        if (error) {
          console.error(`  Error insertando perfil de ${colaborador.nombre}:`, error.message);
          fallidos++;
        } else if (inserted) {
          nuevos++;
        }
      }
    } catch (err) {
      console.error(`Error con ${colaborador.nombre} (${colaborador.orcid}):`, err.message);
      fallidos++;
    }
  }

  console.log(`Listo. Vistos: ${vistos} | Nuevos en staging: ${nuevos} | Fallidos: ${fallidos}`);
}

main().catch((err) => {
  console.error('Fallo general del scraper ORCID:', err);
  process.exit(1);
});
