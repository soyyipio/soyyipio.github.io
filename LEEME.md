# Web de Yipio

Sitio estático (HTML + CSS + JS, sin build), mismo sistema que la web de Matu Venao.
Para verlo local: `python -m http.server 4600` y abrir http://localhost:4600

## Qué se edita y dónde

| Archivo | Qué cambia |
|---|---|
| `data/fechas.json` | Funciones. Las pasadas se ocultan solas y se agrupan por mes. |
| `data/config.json` | `sendsToLandingPage`, texto/mail/teléfono de contacto, redes. |
| `data/bio.json` | Biografía, frase destacada y chips. |
| `data/marquee.json` | Texto de las cintas que se cruzan bajo la portada. |
| `data/granhermano.json` | Números y momentos de la línea de tiempo de GH. |
| `data/instagram.json` | Foto de perfil (`perfil.avatar`) y publicaciones destacadas. |
| `data/descripciones/<show>.txt` | Descripción del show para la landing (ej: `patotera.txt`). |

### Campos nuevos en `fechas.json`

- `"agotado": true` → sello AGOTADO y botón desactivado.
- `"ultimas": true` → badge "Últimas entradas" que late.
- `"destacado": "Estreno"` (o `true` = "Función especial") → ticket dorado con brillo.
- `"visible": false` → la fecha no sale en la web (ni en la landing ni en la placa de reels), pero sí en flyer-maker para armar los flyers antes de anunciarla.

El cartel "Próxima función" toma solo la próxima fecha que no esté agotada.

### Momentos de `granhermano.json`

Cada momento lleva `etiqueta`, `titulo`, `texto` y una de estas cabeceras:
`video` + `poster`, `imagen`, `versus` (`{ "rival": "Cinzia", "resultadoRival": "Eliminada" }`)
o `placa` (texto grande). Opcionales: `frase`, `votos` (barra), `destacado`.

### Reels de Instagram

`python herramientas/actualizar_reels.py` pone los últimos 6 reels de @yipio en `data/instagram.json`
e `img/instagram/` (necesita `pip install playwright pillow` una vez; usa el Edge de Windows).
A los reels nuevos les pone de texto la primera línea del reel: revisarlo antes de commitear.

### Carrete de sorteo (Colonia Express)

`carrete/` (http://localhost:4600/carrete/) arma las placas 1, 3, 4, 5 y 6 del carrete del sorteo Ciberlunes
(la 2/6 la pone Colonia). Fotos por defecto en `carrete/img/`; se cambian desde la página y se descargan en PNG 1080 × 782.
Es solo local: la carpeta está en `.gitignore` y no se sube a GitHub.

## Archivos que se detectan solos (sin tocar JSON)

- `img/banner/1A.png` (PC) / `1B.png` (celular), `2A`, `2B`... → slider de portada.
  Mientras no haya ninguno se muestra el escenario con telón y reflectores,
  con las fotos sin fondo de `img/escenario/` (1 al centro, 2 a la izquierda, 3 a la derecha).
  Si reemplazás esas fotos, que sean PNG/WebP sin fondo, recortadas al borde de la figura.
- `img/biografia/1.webp`, `2.webp`... → galería. `main.webp` es la foto de la bio.
- `img/portadas/<show>.png` (ej: `patotera.png`) → portada de la landing del show.
  Si no hay, se arma un póster tipográfico.
- `videos/granhermano/` → clips de 5-8 segundos, sin audio (se referencian en `granhermano.json`).

## Fuentes

Las de `fonts/` son copias web de las de `PATOTERA/Fonts` con dos arreglos:
- Grift sin hinting: el hinting original deformaba la "M" en Chrome/Windows en tamaños chicos.
- Grind con la tilde de la "Í" achicada: la original invadía la letra de al lado.
