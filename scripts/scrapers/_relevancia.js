// scripts/scrapers/_relevancia.js
//
// Compartido por todos los scrapers (ORCID, UFRO Noticias, Google Scholar).
// No descarta nada — solo marca contenido como "probablemente relevante"
// para que el admin pueda priorizar/ordenar la revisión en la bandeja.
// Ver líneas de investigación en src/pages/index.astro.

export const PALABRAS_CLAVE_IA = [
  'inteligencia artificial', 'artificial intelligence', ' ia ', 'machine learning',
  'aprendizaje automático', 'aprendizaje profundo', 'deep learning', 'red neuronal',
  'neural network', 'nlp', 'procesamiento de lenguaje natural', 'visión computacional',
  'computer vision', 'datos', 'data science', 'algoritmo', 'algorithm',
  'interculturalidad', 'lengua originaria', 'mapudungun', 'agro', 'salud digital',
  'telemedicina', 'industria 4.0', 'automatización', 'gobernanza de datos',
];

export function pareceRelevante(...textos) {
  const t = textos.filter(Boolean).join(' ').toLowerCase();
  return PALABRAS_CLAVE_IA.some((palabra) => t.includes(palabra));
}
