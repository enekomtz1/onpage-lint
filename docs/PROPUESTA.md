# Propuesta de proyecto: onpage-lint

## Nombre

`onpage-lint`

## Problema que resuelve

Antes de publicar un sitio web hay que repasar a mano el SEO on-page de cada
página: que tenga título y descripción únicos, un solo `h1`, `canonical`,
atributo `lang`, imágenes con `alt`, enlaces internos que no estén rotos y
datos estructurados válidos. Es un trabajo repetitivo y fácil de olvidar, y
los errores se cuelan en cuanto el sitio crece.

`onpage-lint` revisa la carpeta de HTML que genera el sitio y avisa de esos
fallos. Devuelve un código de salida distinto de cero cuando hay errores, de
modo que puede bloquear un despliegue en CI.

## Público

Desarrolladores web que publican sitios estáticos (exportación estática de
Next.js, Astro, Hugo, Eleventy o HTML a mano). Yo soy el primer usuario: lo
quiero para mis propios sitios.

## Stack

- TypeScript sobre Node.js 20 o superior, módulos ES.
- `cheerio` para analizar el HTML.
- Vitest para los tests; ESLint y Prettier para el estilo.
- GitHub Actions para la integración continua.

Funciona en local, sin servicios de pago, sin claves y sin conexión a la red.

## Funcionalidades de la v1.0

- Reglas de cabecera: `title`, `meta-description`, `canonical`, `html-lang`,
  `viewport`, `robots-noindex`, Open Graph y `hreflang`.
- Reglas de contenido: `h1` y jerarquía de encabezados, `img-alt`, enlaces
  internos rotos, JSON-LD válido.
- Reglas de sitio: `sitemap.xml` y `robots.txt` coherentes con las páginas.
- Archivo de configuración: activar o desactivar reglas, cambiar su severidad
  y sus umbrales, ignorar rutas.
- Informes en texto, JSON, HTML y SARIF.
- Acción de GitHub reutilizable.
- Documentación de cada regla publicada en GitHub Pages.
- Paquete publicado en npm.

## Por qué es elegible

- Es un proyecto personal, nuevo, sin relación con ningún empleador, cliente
  ni universidad, y sin acuerdos de confidencialidad.
- No construye, entrena, evalúa ni sirve modelos de IA.
- No es una herramienta ofensiva de seguridad.
- No trata datos personales ni regulados: solo lee los archivos HTML del
  propio usuario. Los ejemplos del repositorio son inventados.
- Licencia MIT.
