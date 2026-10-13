// scripts/scrapers/ufroNoticias.js
//
// Scraping del Centro de Noticias UFRO. A diferencia de ORCID, aquí no hay
// API pública: se descarga el HTML del listado y se extraen los datos con
// cheerio (selectores CSS).
//
// IMPORTANTE — selectores sin verificar:
//   No tengo acceso de red a ufro.cl desde este entorno, así que los
//   selectores de abajo (SELECTORES.*) son un punto de partida, NO están
//   confirmados contra el HTML real. Antes de correrlo en serio:
//     1. Corre con --dry-run (no escribe en Supabase, solo imprime lo que
//        encontró) para verificar que los selectores calzan.
//     2. Si no calzan: abre la página del listado de noticias UFRO en el
//        navegador → Inspeccionar → identifica el contenedor que se repite
//        por cada noticia (tarjeta) y ajusta SELECTORES abajo.
//
// Uso:
//   node scripts/scrapers/ufroNoticias.js --dry-run
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/scrapers/ufroNoticias.js

import * as cheerio from 'cheerio';
import { insertStaging, descargarYSubirImagen } from './_supabaseStaging.js';
import { pareceRelevante } from './_relevancia.js';

const URL_LISTADO = 'https://fica.ufro.cl/category/noticias/'; // Facultad de Ingeniería y Ciencias (bajo la cual está el CI²A²). Si prefieres el listado general de toda la universidad, usa https://www.ufro.cl/category/noticias/
const DRY_RUN = process.argv.includes('--dry-run');

// Ajustar estos selectores según el HTML real del sitio (ver nota arriba).
const SELECTORES = {
  tarjeta: 'article.post, .noticia-card, .post-item', // contenedor repetido por noticia
  titulo: 'h2, h3, .entry-title',
  enlace: 'a',
  resumen: 'p, .entry-summary, .excerpt',
  imagen: 'img',
};

// Selectores del cuerpo completo, usados solo al entrar a cada noticia
// individual (el listado no trae el contenido completo).
const SELECTOR_CUERPO = '.entry-content, .post-content, article .elementor-widget-theme-post-content';

function extraerTexto($el) {
  // .text() a veces junta nodos sin espacio cuando el HTML original tiene
  // saltos de línea entre etiquetas (ej. "al<br>monitoreo" → "almonitoreo").
  // Se normalizan los espacios en blanco (saltos de línea incluidos) a uno solo.
  return $el.first().text().replace(/\s+/g, ' ').trim();
}

/**
 * fetch con reintentos. Desde los servidores de GitHub Actions (EE. UU.),
 * fica.ufro.cl a veces no responde a tiempo ("Connect Timeout Error"):
 * en las pruebas del 12-10-2026 falló 2 de 3 corridas, y desde Chile
 * funciona siempre. Se reintenta con espera creciente antes de rendirse;
 * si todos los intentos fallan, el error se propaga y el job falla.
 */
async function fetchConReintentos(url, opciones, intentos = 4) {
  let ultimoError;
  for (let i = 1; i <= intentos; i++) {
    try {
      return await fetch(url, opciones);
    } catch (err) {
      ultimoError = err;
      if (i < intentos) {
        const espera = 5000 * i; // 5 s, 10 s, 15 s
        console.warn(`Intento ${i}/${intentos} falló (${err.cause?.code || err.message}). Reintentando en ${espera / 1000} s...`);
        await new Promise((r) => setTimeout(r, espera));
      }
    }
  }
  throw ultimoError;
}

// Tags de bloque que se conservan del cuerpo. Todo lo demás (menús, botones,
// scripts, iframes) se descarta; el sitio vuelve a sanear el HTML al mostrarlo.
const TAGS_CUERPO = 'p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote';

/**
 * Devuelve el cuerpo de la noticia como HTML con sus párrafos.
 *
 * fica.ufro.cl usa Elementor: el texto vive en un <div class=
 * "elementor-widget-container"> genérico, así que no hay una clase propia
 * del cuerpo que sirva de selector fijo. En vez de eso se elige el
 * contenedor cuyos párrafos directos suman más texto (verificado con
 * scripts de diagnóstico contra una noticia real). Si no hay ninguno con
 * 2+ párrafos, se cae a SELECTOR_CUERPO y, en último caso, a ''.
 */
function extraerCuerpoHtml($) {
  let mejor = null;
  let mejorLargo = 0;

  $('div, section, article, main').each((_, el) => {
    const $el = $(el);
    const parrafos = $el.children('p');
    if (parrafos.length < 2) return;
    const largo = parrafos.text().trim().length;
    if (largo > mejorLargo) {
      mejor = $el;
      mejorLargo = largo;
    }
  });

  if (!mejor) {
    const texto = extraerTexto($(SELECTOR_CUERPO).first());
    return texto ? `<p>${escaparHtml(texto)}</p>` : '';
  }

  const bloques = [];
  mejor.children(TAGS_CUERPO).each((_, el) => {
    const $el = $(el);
    if (!$el.text().replace(/\s+/g, ' ').trim()) return; // párrafos vacíos / &nbsp;
    bloques.push($.html($el));
  });
  return bloques.join('\n');
}

function escaparHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Entra a la noticia individual a buscar la fecha real de publicación y el
 * cuerpo completo (el listado de /category/noticias/ no trae ninguno de
 * los dos). La fecha se busca en este orden de confiabilidad:
 *   1. <meta property="article:published_time"> (lo agrega el plugin SEO
 *      del sitio — AIOSEO — es el dato más confiable si existe)
 *   2. JSON-LD con "datePublished"
 *   3. Cualquier <time datetime="...">
 * Si ninguno existe, la fecha queda null (se puede completar a mano en
 * el admin al revisar).
 */
async function obtenerDetalle(url) {
  const res = await fetchConReintentos(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CI2A2Bot/1.0)' },
  });
  if (!res.ok) return { fecha: null, cuerpo: '' };

  const html = await res.text();
  const $ = cheerio.load(html);

  let fecha =
    $('meta[property="article:published_time"]').attr('content') ||
    $('time[datetime]').first().attr('datetime') ||
    null;

  if (!fecha) {
    // Fallback: buscar "datePublished" dentro de algún bloque JSON-LD.
    $('script[type="application/ld+json"]').each((_, el) => {
      if (fecha) return;
      try {
        const data = JSON.parse($(el).contents().text());
        const nodos = Array.isArray(data?.['@graph']) ? data['@graph'] : [data];
        const conFecha = nodos.find((n) => n?.datePublished);
        if (conFecha) fecha = conFecha.datePublished;
      } catch {
        // JSON-LD malformado o no relacionado — se ignora, no es crítico.
      }
    });
  }

  const cuerpo = extraerCuerpoHtml($);

  return { fecha, cuerpo };
}

async function scrapearListado() {
  const res = await fetchConReintentos(URL_LISTADO, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CI2A2Bot/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} al obtener ${URL_LISTADO}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const items = [];

  $(SELECTORES.tarjeta).each((_, el) => {
    const $card = $(el);
    const $enlace = $card.find(SELECTORES.enlace).first();
    const url = $enlace.attr('href');
    const titulo = extraerTexto($card.find(SELECTORES.titulo));
    const resumen = extraerTexto($card.find(SELECTORES.resumen));
    const imagen = $card.find(SELECTORES.imagen).first().attr('src');

    if (!titulo || !url) return; // sin título o sin link, descartar

    items.push({
      fuente_id: url,
      titulo,
      bajada: resumen || null,
      image_url: imagen || null,
      url,
    });
  });

  return items;
}

async function main() {
  console.log(`Descargando listado de ${URL_LISTADO} ...`);
  const items = await scrapearListado();
  console.log(`Encontrados: ${items.length} items con los selectores actuales.`);

  if (items.length === 0) {
    // Antes esto solo avisaba y terminaba "bien" (código de salida 0) — un
    // rediseño del sitio de UFRO podía romper los selectores sin que nadie
    // se enterara nunca. Ahora falla de verdad: en el cron de GitHub
    // Actions, un fallo dispara el correo automático de "workflow failed"
    // a quien tenga notificaciones activadas en el repo.
    throw new Error(
      'No se encontró ninguna noticia — revisa SELECTORES en este archivo contra el HTML real de la página (puede que fica.ufro.cl haya cambiado de estructura).'
    );
  }

  console.log('Entrando a cada noticia individual por fecha y cuerpo completo...');
  const itemsCompletos = [];
  for (const item of items) {
    const { fecha, cuerpo } = await obtenerDetalle(item.url);

    // Descarga la imagen y la sube a tu propio Supabase Storage, en vez de
    // dejarla apuntando al servidor externo de fica.ufro.cl. Si algo falla
    // (imagen caída, red, etc.), sigue con la URL externa como respaldo en
    // vez de perder la imagen por completo.
    let imagenFinal = item.image_url;
    if (item.image_url && !DRY_RUN) {
      const extension = item.image_url.split('.').pop().split('?')[0] || 'webp';
      const slug = item.fuente_id.split('/').filter(Boolean).pop();
      const nombreArchivo = `${slug}.${extension}`;
      const urlSubida = await descargarYSubirImagen(item.image_url, 'noticias-img', nombreArchivo);
      if (urlSubida) imagenFinal = urlSubida;
    }

    itemsCompletos.push({
      ...item,
      fecha,
      cuerpo,
      image_url: imagenFinal,
      relevante_ia: pareceRelevante(item.titulo, item.bajada),
    });
  }

  if (DRY_RUN) {
    console.log('--dry-run activo: no se escribe en Supabase. Primeros items:');
    console.log(JSON.stringify(itemsCompletos.slice(0, 5), null, 2));
    return;
  }

  let nuevos = 0;
  let fallidos = 0;

  for (const item of itemsCompletos) {
    const { inserted, error } = await insertStaging({
      tipo: 'noticia',
      fuente: 'ufro_noticias',
      fuente_id: item.fuente_id,
      payload: {
        titulo: item.titulo,
        bajada: item.bajada,
        cuerpo: item.cuerpo,
        fecha: item.fecha,
        image_url: item.image_url,
        url_original: item.url,
        relevante_ia: item.relevante_ia,
      },
    });

    if (error) {
      console.error(`  Error insertando "${item.titulo}":`, error.message);
      fallidos++;
    } else if (inserted) {
      nuevos++;
    }
  }

  console.log(`Listo. Nuevos en staging: ${nuevos} | Fallidos: ${fallidos}`);
}

main().catch((err) => {
  console.error('Fallo general del scraper UFRO Noticias:', err);
  process.exit(1);
});