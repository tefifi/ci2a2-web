// scripts/scrapers/_supabaseStaging.js
//
// Cliente compartido para todos los scrapers. Usa la SERVICE ROLE KEY
// (no la anon key) porque estos scripts corren fuera del navegador,
// vía cron (GitHub Actions / Vercel Cron), y necesitan poder escribir
// en contenido_staging sin pasar por el login del panel admin.
//
// Variables de entorno requeridas, definidas en scripts/.env.scrapers
// (NUNCA en el .env público del sitio, y NUNCA comitear ese archivo a git):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carga scripts/.env.scrapers sin importar desde qué carpeta se ejecute el script.
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.scrapers') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno del scraper.'
  );
}

export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Inserta un item en contenido_staging, ignorando silenciosamente si ya
 * existe (mismo tipo + fuente + fuente_id), gracias al índice único.
 *
 * @param {{tipo: string, fuente: string, fuente_id: string, payload: object, colaborador_id?: string}} item
 * @returns {Promise<{inserted: boolean, error?: any}>}
 */
export async function insertStaging(item) {
  const { error } = await supabaseAdmin
    .from('contenido_staging')
    .insert([
      {
        tipo: item.tipo,
        fuente: item.fuente,
        fuente_id: item.fuente_id,
        payload: item.payload,
        colaborador_id: item.colaborador_id ?? null,
        estado: 'pendiente',
      },
    ]);

  if (error) {
    // 23505 = violación de unique constraint -> ya existía, no es un error real
    if (error.code === '23505') return { inserted: false };
    return { inserted: false, error };
  }
  return { inserted: true };
}

/**
 * Descarga una imagen desde una URL externa y la sube a Supabase Storage,
 * devolviendo la URL pública en tu propio proyecto. Si la descarga o la
 * subida fallan, devuelve null (el llamador decide qué hacer — por
 * ejemplo, dejar el campo image_url vacío en vez de romper todo el scraper).
 *
 * @param {string} urlOrigen - URL externa de la imagen a descargar
 * @param {string} bucket - nombre del bucket de Storage (debe existir y ser público)
 * @param {string} nombreArchivo - nombre a usar en el bucket (incluye extensión)
 */
export async function descargarYSubirImagen(urlOrigen, bucket, nombreArchivo) {
  try {
    const res = await fetch(urlOrigen, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CI2A2Bot/1.0)' },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || 'image/webp';
    const buffer = Buffer.from(await res.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(nombreArchivo, buffer, { contentType, upsert: true });

    if (error) {
      console.error(`  Error subiendo imagen a Storage (${nombreArchivo}):`, error.message);
      return null;
    }

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(nombreArchivo);
    return data.publicUrl;
  } catch (err) {
    console.error(`  Error descargando imagen ${urlOrigen}:`, err.message);
    return null;
  }
}

/**
 * Trae los colaboradores que tienen un identificador externo (orcid,
 * google_scholar) para que cada scraper sepa a quién scrapear y a qué
 * colaborador_id asociar los resultados.
 *
 * @param {'orcid'|'google_scholar'} campo
 */
export async function getColaboradoresConIdentificador(campo) {
  const { data, error } = await supabaseAdmin
    .from('colaboradores')
    .select(`id, nombre, ${campo}`)
    .not(campo, 'is', null)
    .neq(campo, '');

  if (error) throw error;
  return data;
}
