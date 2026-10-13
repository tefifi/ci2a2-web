// src/lib/sanitizeHtml.ts
//
// Sanea HTML que viene de fuera (noticias scrapeadas, descripciones de
// proyectos, bios) antes de pintarlo con set:html, para evitar XSS.
//
// Usa `sanitize-html` (JavaScript puro) en vez de `isomorphic-dompurify`:
// este último arrastra jsdom, que falla al cargarse en las funciones
// serverless de Vercel y hacía devolver HTTP 500 en las páginas de detalle.
import sanitizeHtml from 'sanitize-html';

const OPCIONES: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img',
    'h1',
    'h2',
    'figure',
    'figcaption',
  ]),
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    // Los links externos no deben poder manipular la pestaña de origen.
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
  },
};

export function sanitize(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, OPCIONES);
}
