# Plataforma Web CI2A2 - Universidad de La Frontera

**Demo en vivo:** [https://ci2a2-web.vercel.app](https://ci2a2-web.vercel.app)

Repositorio oficial del sitio web del **Centro de Investigación en Inteligencia Artificial Aplicada (CI2A2)** de la Universidad de La Frontera.

Esta plataforma tiene como objetivo la divulgación científica, la visualización del portafolio de proyectos de I+D+i y la vinculación con el medio a través de noticias y eventos. El desarrollo se centra en el rendimiento, la optimización para motores de búsqueda (SEO) y la escalabilidad de contenidos.

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Requisitos del Sistema](#requisitos-del-sistema)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Scripts Disponibles](#scripts-disponibles)
6. [Pipeline de Scraping y Revisión](#pipeline-de-scraping-y-revisión)
7. [Sistema de Diseño](#sistema-de-diseño)
8. [Gotchas conocidos](#gotchas-conocidos)

---

## Descripción General

El sistema es una aplicación web basada en arquitectura Jamstack, permitiendo tanto la generación de sitios estáticos (SSG) como el renderizado del lado del servidor (SSR) para secciones dinámicas.

**Funcionalidades principales:**
* **Catálogo de Proyectos:** Sistema de filtrado y paginación para iniciativas de investigación.
* **Enriquecimiento automático de contenido:** scrapers que traen publicaciones, noticias y datos de perfil desde fuentes externas (ORCID, OpenAlex, Centro de Noticias UFRO), con una bandeja de revisión humana antes de publicar nada — ver [Pipeline de Scraping y Revisión](#pipeline-de-scraping-y-revisión).
* **Panel de Administración:** CMS personalizado protegido para la gestión de noticias, colaboradores, proyectos, publicaciones, biblioteca, agenda, alianzas y transparencia (CRUD).
* **Gestión de Medios:** Carga de imágenes a Supabase Storage (banners, biblioteca, noticias scrapeadas, documentos de transparencia).
* **Interfaz Institucional:** Diseño adaptativo (responsive) alineado con la identidad visual corporativa de la UFRO.

---

## Arquitectura Técnica

| Componente | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Framework Core** | Astro | Generación de sitio, optimización de imágenes y enrutamiento. |
| **Backend / DB** | Supabase | PostgreSQL, Auth y Storage para gestión de contenidos. |
| **Scraping** | Scripts Node standalone (`scripts/scrapers/`) | Traen contenido de ORCID, OpenAlex y UFRO Noticias — ver sección dedicada abajo. |
| **Framework UI** | Bootstrap 5 | Sistema de grillas y componentes visuales. |
| **Lenguaje** | TypeScript / JavaScript | Lógica de negocio y control de tipos. |
| **Iconografía** | Bootstrap Icons | Biblioteca de iconos vectoriales SVG. |
| **Sanitización HTML** | isomorphic-dompurify | Limpia el HTML editado en el admin (RichEditor) antes de insertarlo en la página — ver [Gotchas conocidos](#gotchas-conocidos). |

---

## Requisitos del Sistema

Para ejecutar este proyecto en un entorno local, se requiere:

* **Node.js:** Versión 22 (es la que se usa en desarrollo y en el workflow de GitHub Actions).
* **NPM:** Versión 9.0.0 o superior.
* **Git:** Sistema de control de versiones.
* **Credenciales:** Acceso a la instancia de Supabase (URL y API Keys).

### Variables de entorno

Este proyecto usa **dos** archivos de entorno separados, con propósitos distintos:

**`.env`** (raíz del proyecto) — usado por el sitio (Astro/Vite), estas claves terminan expuestas en el navegador, por eso son las públicas (`anon key`, nunca la `service_role`):

```
PUBLIC_SUPABASE_URL=tu_url_supabase
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_supabase
```

**`scripts/.env.scrapers`** (copiar desde `scripts/.env.scrapers.example`) — usado solo por los scrapers, que corren fuera del navegador (terminal o GitHub Actions) y necesitan permisos de escritura completos:

```
SUPABASE_URL=tu_url_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

La `service_role key` **nunca** debe estar en `.env` ni exponerse al navegador — se salta todas las reglas de seguridad (RLS) de la base de datos. Ambos archivos están en `.gitignore`.

---

## Instalación y Configuración

```bash
git clone https://github.com/tefifi/ci2a2-web.git
cd ci2a2-web
npm install
npm run dev
```

---

## Scripts Disponibles

| Comando | Qué hace |
| :--- | :--- |
| `npm run dev` | Levanta el sitio en modo desarrollo. |
| `npm run build` | Compila el sitio para producción — correr antes de cada deploy para detectar errores temprano. |
| `npm run preview` | Sirve localmente el build de producción. |
| `npm run scrape:orcid` | Trae publicaciones + perfil (bio/institución/cargo) de colaboradores con ORCID registrado. |
| `npm run scrape:noticias` | Trae noticias desde `fica.ufro.cl/category/noticias/`. |
| `npm run scrape:openalex` | Trae publicaciones + biblioteca (documentos de acceso abierto) + área de investigación vía OpenAlex, buscando por ORCID. |
| `npm run scrape:all` | Corre los tres scrapers en secuencia. |
| `npm run types:generate` | Genera los tipos TypeScript reales desde el esquema de Supabase (`src/lib/database.types.ts`). **Ver nota en Gotchas conocidos — esto no se ha corrido nunca con credenciales reales.** |

Todos los scripts de scraping aceptan `--dry-run` (ej. `node scripts/scrapers/orcid.js --dry-run`) para probar sin escribir en Supabase.

---

## Pipeline de Scraping y Revisión

El sitio no depende solo de carga manual en el admin — hay un pipeline de scraping que trae contenido de fuentes externas y lo deja pendiente de aprobación humana antes de publicarlo.

### Fuentes

| Fuente | Qué trae | Script |
| :--- | :--- | :--- |
| **ORCID** (API pública, sin bloqueos) | Publicaciones, biografía, institución y cargo actual | `scripts/scrapers/orcid.js` |
| **OpenAlex** (API pública, sin bloqueos) | Publicaciones (búsqueda por ORCID, más confiable que por nombre), biblioteca (documentos de acceso abierto), área de investigación | `scripts/scrapers/openAlex.js` |
| **UFRO Noticias** (scraping HTML, `fica.ufro.cl`) | Noticias — título, bajada, cuerpo completo, fecha, imagen (descargada y subida a Storage propio) | `scripts/scrapers/ufroNoticias.js` |

> **Nota:** originalmente se evaluó Google Scholar, pero bloquea las requests automatizadas desde el primer intento (sin API oficial). Se reemplazó por OpenAlex, que cubre lo mismo de forma confiable.

### Flujo

1. Cada scraper escribe en la tabla `contenido_staging` (nunca directo a las tablas públicas), con `estado = 'pendiente'`.
2. Un índice único (`tipo`, `fuente`, `fuente_id`) evita duplicados entre corridas.
3. En el admin → **Sistema → Revisión (scraping)** (`AdminRevision.jsx`), cada item pendiente se puede **Aprobar** (copia el contenido a la tabla real — `noticias`, `publicaciones`, `biblioteca`, o hace un `UPDATE` parcial sobre `colaboradores`) o **Rechazar**.
4. Los items marcados como relacionados a IA / líneas de investigación del centro (`_relevancia.js`, coincidencia de palabras clave) aparecen primero en la bandeja — no se descarta nada automáticamente, solo se prioriza el orden.
5. Para `colaborador` (actualización de perfil), la tarjeta muestra "Actual → Propuesto" por campo, para poder detectar discrepancias antes de aprobar.

### Automatización

`.github/workflows/scrapers.yml` corre los tres scrapers todos los días a las 06:00 UTC vía GitHub Actions. Requiere los secrets `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` configurados en el repositorio (Settings → Secrets and variables → Actions). **Este workflow existe en el código pero aún no se ha activado** (el repo aún no se subió a GitHub con los secrets configurados).

Si un scraper no encuentra nada donde debería (por ejemplo, si UFRO rediseña su sitio y los selectores dejan de calzar), el script falla intencionalmente (no solo loguea) para que GitHub Actions envíe el correo automático de "workflow failed" — no depende de que alguien note manualmente que dejaron de llegar noticias.

---

## Sistema de Diseño

* **`public/styles/global.css`** es la única fuente de verdad para colores (`--ufro-blue`, `--ufro-pink`, etc.), el sistema de botones (`.btn-ci2a2` + modificadores), y utilidades compartidas (`.hover-up`, `.py-6`, etc.) en todo el sitio público. Las páginas no deben redefinir estos valores localmente.
* El panel admin comparte los mismos tokens (`AdminLayout.astro` importa `global.css`).
* Los paneles CRUD del admin (Proyectos, Alianzas, Noticias, Colaboradores, Transparencia, Agenda, Biblioteca, Publicaciones) usan el hook compartido `useAdminCRUD` (`src/components/admin/hooks/useAdminCRUD.js`) y los componentes de `src/components/admin/components/AdminUI.jsx` (`AdminPageHeader`, `FormHeader`, `FormActions`, `SidebarCard`, `ListaAcciones`, `ListaVacia`, `ImageUploadZone`). **Cualquier panel CRUD nuevo debería partir de ahí en vez de reimplementar el layout a mano** — la causa de la mayoría de las inconsistencias visuales encontradas fue justamente no usar este kit.
* `AdminBanners` y `AdminManuales` son excepciones deliberadas (necesidades de UI genuinamente distintas: reordenar con drag & drop, y gestión de versiones de archivos).

---

## Gotchas conocidos

Cosas que costó descubrir y vale la pena que la próxima persona no tenga que redescubrir:

* **Nombres de columna inconsistentes entre tablas.** La mayoría usa español (`titulo`, `bajada`, `imagen_url`), pero `publicaciones` usa **`title`** en inglés. Antes de mapear un payload a una tabla nueva, verificar el nombre real de columna con:
  ```sql
  select column_name, data_type from information_schema.columns where table_name = 'nombre_tabla';
  ```
* **`colaboradores.id` es `bigint`**, no `uuid` — si se agrega una FK nueva hacia esa tabla, el tipo debe ser `bigint`.
* **Los tipos de TypeScript de Supabase son un placeholder.** `src/lib/database.types.ts` nunca se generó contra el esquema real (`npm run types:generate` requiere login de la CLI de Supabase, que no se hizo). El genérico `<Database>` está **desactivado a propósito** en `src/lib/supabase.ts` — un placeholder con índice genérico rompe la inferencia de tipos de `supabase-js` (todo se vuelve `never` en vez de `any`). Generar los tipos reales y reactivar `<Database>` en las dos llamadas a `createClient` es trabajo pendiente.
* **`StatsAndCharts.astro` necesita colores en hex literal**, no variables CSS — dibuja sobre `<canvas>` (Chart.js), que no puede resolver `var(--ufro-blue)`.
* **`noticias.destacada`** existe como columna pero no se usa activamente para nada más que el fallback de la portada — revisar si vale la pena construir una UI para marcarla desde el admin.
* Los items de perfil de colaborador (`tipo: 'colaborador'` en `contenido_staging`) se regeneran una vez al mes (`fuente_id` incluye año-mes) para permitir actualizaciones — si no se aprueban ni rechazan, se van acumulando pendientes de meses distintos para la misma persona.