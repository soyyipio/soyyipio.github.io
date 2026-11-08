"""Pone los últimos reels de @yipio en la sección Instagram de la web.

Uso (desde cualquier carpeta):
  python herramientas/actualizar_reels.py [--cantidad 6] [--ver]

Abre Instagram con el Edge de Windows (sin login, sin ventana; --ver la muestra),
lee los últimos reels y actualiza data/instagram.json e img/instagram/1.webp, 2.webp...
Los reels que ya estaban conservan su imagen y su texto. A los nuevos les pone
como texto la primera línea del reel, limpia y recortada: revisarlos en el JSON.
No commitea.

Requisitos (una sola vez): pip install playwright pillow
"""
import argparse
import io
import json
import re
import sys
import unicodedata
import urllib.request
from datetime import date
from pathlib import Path

from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
PERFIL = 'https://www.instagram.com/yipio/reels/'
TAMANO = (360, 640)
LARGO_TEXTO = 35
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

# Corre dentro de la página de reels. Devuelve, del más nuevo al más viejo:
# url, portada (URL del CDN, vence en unos días), fecha y texto original.
LEER_REELS = r"""
async (cantidad) => {
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const tiles = new Map();
  document.querySelectorAll('a[href*="/reel/"]').forEach((a) => {
    const id = (a.getAttribute('href').match(/\/reel\/([^/?]+)/) || [])[1];
    if (id && !tiles.has(id)) tiles.set(id, a);
  });

  function portada(a) {
    const conFondo = [a, ...a.querySelectorAll('*')]
      .find((e) => getComputedStyle(e).backgroundImage.startsWith('url('));
    if (conFondo) return getComputedStyle(conFondo).backgroundImage.slice(5, -2);
    return a.querySelector('img')?.src || null;
  }

  // "... - yipio on October 27, 2026: "texto"." (o "el 27 de octubre de 2026" en español)
  function fecha(desc) {
    let m = desc.match(/ on ([A-Z][a-z]+ \d{1,2}, \d{4})/);
    if (m) {
      const d = new Date(m[1]);
      if (!isNaN(d)) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    m = desc.match(/(\d{1,2}) de ([a-záéíóú]+) de (\d{4})/i);
    if (m && MESES.includes(m[2].toLowerCase())) {
      return `${m[3]}-${String(MESES.indexOf(m[2].toLowerCase()) + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
    return null;
  }

  // El texto y la fecha no están en la grilla: se leen de la página de cada reel.
  const reels = await Promise.all([...tiles].slice(0, cantidad + 3).map(async ([id, a]) => {
    let desc = '';
    try {
      const html = await (await fetch(`/reel/${id}/`, { credentials: 'include' })).text();
      desc = new DOMParser().parseFromString(html, 'text/html')
        .querySelector('meta[property="og:description"]')?.content || '';
    } catch (e) { /* queda sin texto ni fecha */ }
    return {
      url: `https://www.instagram.com/reel/${id}/`,
      portada: portada(a),
      fecha: fecha(desc),
      texto_original: (desc.match(/: "([\s\S]*)"\.?\s*$/) || [])[1] || '',
    };
  }));

  // Los fijados aparecen primero aunque sean viejos: se ordena por fecha
  // (el sort es estable, así que dos del mismo día quedan en el orden de la grilla).
  if (reels.every((r) => r.fecha)) reels.sort((x, y) => y.fecha.localeCompare(x.fecha));
  return reels.slice(0, cantidad);
}
"""


def leer_reels(cantidad, ver):
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        # Edge viene con Windows; si no está, Chrome; si tampoco, el Chromium de Playwright.
        for canal in ('msedge', 'chrome', None):
            try:
                navegador = p.chromium.launch(channel=canal, headless=not ver)
                break
            except Exception:
                if canal is None:
                    raise
        pagina = navegador.new_page(locale='en-US', viewport={'width': 1280, 'height': 1600})
        pagina.goto(PERFIL, wait_until='domcontentloaded')
        try:
            pagina.wait_for_selector('a[href*="/reel/"]', timeout=30000)
        except Exception:
            sys.exit('No aparecieron reels (¿Instagram pidió login?). Probá con --ver para mirar qué muestra.')
        # La grilla carga de a poco: se baja hasta tener de sobra (por si hay fijados).
        for _ in range(10):
            if pagina.locator('a[href*="/reel/"]').count() >= cantidad + 3:
                break
            pagina.mouse.wheel(0, 1200)
            pagina.wait_for_timeout(700)
        reels = pagina.evaluate(LEER_REELS, cantidad)
        navegador.close()
    return reels


def texto_corto(original):
    """Primera línea con contenido, sin emojis, hashtags ni @, en minúscula si venía en mayúsculas."""
    for linea in original.splitlines():
        linea = re.sub(r'[#@][\w.]+', '', linea)
        linea = ''.join(c for c in linea if unicodedata.category(c)[0] in 'LNPZ' and c not in '‍️')
        linea = re.sub(r'\s+', ' ', linea).strip(' .-·|')
        if len(re.sub(r'\W', '', linea)) < 3:
            continue
        if linea.isupper():
            linea = linea.capitalize()
        if len(linea) > LARGO_TEXTO:
            linea = linea[:LARGO_TEXTO].rsplit(' ', 1)[0].rstrip(',.:;') + '…'
        return linea
    return 'Ver en Instagram'


def bajar_portada(url):
    pedido = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(pedido, timeout=30) as r:
        imagen = Image.open(io.BytesIO(r.read())).convert('RGB')
    salida = io.BytesIO()
    ImageOps.fit(imagen, TAMANO, Image.LANCZOS).save(salida, 'WEBP', quality=80, method=6)
    return salida.getvalue()


def una_linea(p):
    return '{ ' + ', '.join(f'{json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}' for k, v in p.items()) + ' }'


def guardar_json(ruta, data):
    # Mismo formato que el archivo a mano: todo indentado y cada publicación en una línea.
    resto = {k: v for k, v in data.items() if k != 'publicaciones'}
    texto = json.dumps(resto, indent=2, ensure_ascii=False)
    items = ',\n'.join('    ' + una_linea(p) for p in data['publicaciones'])
    texto = texto[:-2] + f',\n  "publicaciones": [\n{items}\n  ]\n}}\n'
    ruta.write_text(texto, encoding='utf-8')


def aplicar(reels, raiz):
    ruta_json = raiz / 'data' / 'instagram.json'
    carpeta = raiz / 'img' / 'instagram'
    data = json.loads(ruta_json.read_text(encoding='utf-8'))
    anteriores = {p['url']: p for p in data.get('publicaciones', [])}

    publicaciones, imagenes, nuevos = [], [], []
    for i, reel in enumerate(reels, 1):
        viejo = anteriores.get(reel['url'])
        # Las imágenes viejas se leen todas antes de escribir: los números se corren.
        archivo_viejo = viejo and viejo.get('imagen') and raiz / viejo['imagen']
        if archivo_viejo and archivo_viejo.exists():
            imagenes.append(archivo_viejo.read_bytes())
        else:
            if not reel.get('portada'):
                sys.exit(f'No se encontró la portada de {reel["url"]}')
            imagenes.append(bajar_portada(reel['portada']))
            nuevos.append(reel['url'])
        publicaciones.append({
            'url': reel['url'],
            'imagen': f'img/instagram/{i}.webp',
            'tipo': (viejo or {}).get('tipo', 'reel'),
            'texto': (viejo or {}).get('texto') or texto_corto(reel.get('texto_original', '')),
        })

    if publicaciones == data.get('publicaciones'):
        print('Sin cambios: la web ya tiene los últimos reels.')
        return

    for i, contenido in enumerate(imagenes, 1):
        (carpeta / f'{i}.webp').write_bytes(contenido)
    for sobrante in carpeta.glob('*.webp'):
        if re.fullmatch(r'\d+', sobrante.stem) and int(sobrante.stem) > len(imagenes):
            sobrante.unlink()

    data['publicaciones'] = publicaciones
    if '_comentario' in data:
        hoy = date.today().strftime('%d/%m/%Y')
        data['_comentario'] = re.sub(r'al \d{2}/\d{2}/\d{4}', f'al {hoy}', data['_comentario'])
    guardar_json(ruta_json, data)

    for p in publicaciones:
        marca = 'NUEVO ' if p['url'] in nuevos else '      '
        print(f'{marca}{p["imagen"]}  {p["texto"]}  ({p["url"]})')
    print(f'\n{len(nuevos)} reel(s) nuevo(s). Revisá sus textos en data/instagram.json antes de commitear.')


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    args = argparse.ArgumentParser(description='Pone los últimos reels de @yipio en la web.')
    args.add_argument('--cantidad', type=int, default=6)
    args.add_argument('--ver', action='store_true', help='mostrar la ventana del navegador')
    args.add_argument('--raiz', type=Path, default=RAIZ, help=argparse.SUPPRESS)
    args = args.parse_args()

    print('Leyendo Instagram...')
    reels = leer_reels(args.cantidad, args.ver)
    aplicar(reels, args.raiz)


if __name__ == '__main__':
    main()
