# El sí de las niñas · 5º PAI — sitio de aula

Sitio estático (HTML + CSS + un poco de JavaScript): no necesita servidor ni base de datos.

## Publicarlo en GitHub Pages
1. Crea un repositorio nuevo (por ejemplo `lyl-5pai`) y sube **todo el contenido de esta carpeta** a la rama `main`.
2. En el repositorio: *Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`*.
3. En un par de minutos estará en `https://TU-USUARIO.github.io/lyl-5pai/`.

## Contenido
- `index.html` y las páginas `contexto`, `personajes`, `lectura`, `perspectiva-sesgo`, `contraste`, `debate`, `ensayo`, `cierre` y `recursos`.
- `css/style.css` (colores y diseño), `js/script.js` (guardado de respuestas, tarjetas, lectura en voz alta), `img/` (mapa de personajes).
- `descargas/Cuaderno_alumnado_El_si_de_las_ninas_5PAI.docx`: cuaderno imprimible.
- `build/`: generador de las páginas (opcional; puedes borrar la carpeta, el sitio funciona sin ella).

## Cambiar los colores
En lo alto de `css/style.css` están las variables (`--navy`, `--orange`, `--orange-d`…). El naranja de texto (`--orange-d`) es más oscuro a propósito, para que se lea bien sobre blanco.
