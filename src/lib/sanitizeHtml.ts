// src/lib/sanitizeHtml.ts
//
// Sanea HTML que viene de fuera (noticias scrapeadas, descripciones de
// proyectos, bios) antes de pintarlo con set:html, para evitar XSS.
//
// Usa `xss`, que es CommonJS puro y no tiene dependencias ESM. Antes se usó
// `isomorphic-dompurify` (jsdom) y luego `sanitize-html` (htmlparser2): las
// dos fallaban en las funciones de Vercel con ERR_REQUIRE_ESM, porque su
// cargador no puede hacer require() de módulos ESM, y las páginas de
// detalle devolvían HTTP 500. Si cambias de librería, prueba el preview de
// Vercel antes de mergear: en local con Node 22 estos errores no aparecen.
import xss from 'xss';

// El default export está tipado como función, pero en runtime trae las
// utilidades de la librería; se accede con un cast.
const { getDefaultWhiteList } = xss as unknown as {
  getDefaultWhiteList: () => Record<string, string[]>;
};

const OPCIONES = {
  whiteList: {
    ...getDefaultWhiteList(),
    figure: [],
    figcaption: [],
  },
  // Quita las etiquetas no permitidas en vez de mostrarlas como texto, y
  // elimina por completo el contenido de script y style.
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

export function sanitize(html: string | null | undefined): string {
  if (!html) return '';
  // Los links externos no deben poder manipular la pestaña de origen. Se
  // agrega rel después de sanear: el texto escapado nunca contiene "<a ".
  return xss(html, OPCIONES).replace(/<a\s/g, '<a rel="noopener noreferrer" ');
}