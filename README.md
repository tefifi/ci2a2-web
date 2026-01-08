# Plataforma Web CI2A2 - Universidad de La Frontera

![Build Status](https://img.shields.io/badge/build-passing-success) ![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-Proprietary-lightgrey)

Repositorio oficial del sitio web del **Centro de Investigación en Inteligencia Artificial Aplicada (CI2A2)** de la Universidad de La Frontera.

Esta plataforma tiene como objetivo la divulgación científica, la visualización del portafolio de proyectos de I+D+i y la vinculación con el medio a través de noticias y eventos. El desarrollo se centra en el rendimiento, la optimización para motores de búsqueda (SEO) y la escalabilidad de contenidos.

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Requisitos del Sistema](#requisitos-del-sistema)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Modelo de Datos](#modelo-de-datos)
7. [Despliegue](#despliegue)
8. [Licencia y Créditos](#licencia-y-créditos)

---

## Descripción General

El sistema es una aplicación web basada en arquitectura Jamstack híbrida, permitiendo tanto la generación de sitios estáticos (SSG) como el renderizado del lado del servidor (SSR) para secciones dinámicas.

**Funcionalidades principales:**
* **Catálogo de Proyectos:** Sistema de filtrado y paginación para iniciativas de investigación.
* **Gestión de Noticias:** Módulo de novedades con rutas dinámicas.
* **Interfaz Institucional:** Diseño adaptativo (responsive) alineado con la identidad visual corporativa.

---

## Arquitectura Técnica

El proyecto utiliza las siguientes tecnologías y librerías:

| Componente | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Framework Core** | Astro | Generación de sitio y enrutamiento. |
| **Backend / Base de Datos** | Supabase | PostgreSQL como servicio, autenticación y almacenamiento. |
| **Framework UI** | Bootstrap 5 | Sistema de diseño y componentes visuales. |
| **Lenguaje** | TypeScript / JavaScript | Lógica de negocio y control de tipos. |
| **Iconografía** | Bootstrap Icons | Biblioteca de iconos vectoriales SVG. |

---

## Requisitos del Sistema

Para ejecutar este proyecto en un entorno de desarrollo local, se requiere:

* **Node.js:** Versión 18.14.1 o superior.
* **NPM:** Versión 9.0.0 o superior.
* **Git:** Sistema de control de versiones.
* **Acceso a Supabase:** Credenciales del proyecto (URL y API Key).


