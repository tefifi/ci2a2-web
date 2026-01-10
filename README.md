# Plataforma Web CI2A2 - Universidad de La Frontera

Repositorio oficial del sitio web del **Centro de Investigación en Inteligencia Artificial Aplicada (CI2A2)** de la Universidad de La Frontera.

Esta plataforma tiene como objetivo la divulgación científica, la visualización del portafolio de proyectos de I+D+i y la vinculación con el medio a través de noticias y eventos. El desarrollo se centra en el rendimiento, la optimización para motores de búsqueda (SEO) y la escalabilidad de contenidos.

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Requisitos del Sistema](#requisitos-del-sistema)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Scripts Disponibles](#scripts-disponibles)

---

## Descripción General

El sistema es una aplicación web basada en arquitectura Jamstack, permitiendo tanto la generación de sitios estáticos (SSG) como el renderizado del lado del servidor (SSR) para secciones dinámicas.

**Funcionalidades principales:**
* **Catálogo de Proyectos:** Sistema de filtrado y paginación para iniciativas de investigación.
* **Gestión de Publicaciones (Zotero):** Integración automática con la API de Zotero para sincronizar papers científicos en tiempo real.
* **Panel de Administración:** CMS personalizado protegido para la gestión de noticias, colaboradores y proyectos (CRUD).
* **Gestión de Medios:** Carga de imágenes optimizada con recorte de punto focal (Focal Point Cropping).
* **Interfaz Institucional:** Diseño adaptativo (responsive) alineado con la identidad visual corporativa de la UFRO.

---

## Arquitectura Técnica

El proyecto utiliza las siguientes tecnologías y librerías:

| Componente | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Framework Core** | Astro | Generación de sitio, optimización de imágenes y enrutamiento. |
| **Backend / DB** | Supabase | PostgreSQL, Auth y Storage para gestión de contenidos. |
| **Integraciones** | Zotero API | Sincronización de bibliografía científica. |
| **Framework UI** | Bootstrap 5 | Sistema de grillas y componentes visuales. |
| **Lenguaje** | TypeScript / JavaScript | Lógica de negocio y control de tipos. |
| **Iconografía** | Bootstrap Icons | Biblioteca de iconos vectoriales SVG. |

---

## Requisitos del Sistema

Para ejecutar este proyecto en un entorno local, se requiere:

* **Node.js:** Versión 18.14.1 o superior.
* **NPM:** Versión 9.0.0 o superior.
* **Git:** Sistema de control de versiones.
* **Credenciales:** Acceso a la instancia de Supabase (URL y API Keys).

---


Este proyecto requiere variables de entorno para conectar con Supabase y Zotero. Crea un archivo .env en la raíz del proyecto y agrega las siguientes claves:

PUBLIC_SUPABASE_URL=tu_url_supabase
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_supabase
VITE_ZOTERO_API_KEY=tu_api_key_zotero

## Instalación y Configuración
Sigue estos pasos para levantar el entorno de desarrollo:
### 1. Clonar el repositorio
```bash
git clone [https://github.com/tefifi/ci2a2-web.git](https://github.com/tefifi/ci2a2-web.git)
cd ci2a2-web
npm install
npm run dev


