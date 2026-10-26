// Contacto y redes: se editan en data/config.json.
// Mail y teléfono son opcionales: si están vacíos, no aparecen sus botones
// y el botón principal pasa a ser "Escribile por Instagram" (mensaje directo).
// Las redes también se usan en el footer (de esta página y de evento.html).
(function () {
  const Y = window.YIPIO;
  const textoEl = document.getElementById('contactoTexto');
  const botonesWrap = document.getElementById('contactoBotones');
  const redesWraps = [document.getElementById('redesList'), document.getElementById('footerRedes')].filter(Boolean);

  Y.cargarJSON('data/config.json')
    .then((cfg) => {
      const contacto = cfg.contacto || {};
      const redes = cfg.redes || {};

      if (textoEl && contacto.texto) textoEl.textContent = contacto.texto;
      else if (textoEl) textoEl.remove();

      if (botonesWrap) {
        const botones = [];
        const usuarioIG = Y.usuarioInstagram(redes.instagram || '');
        if (contacto.email) {
          botones.push(`<a class="btn btn-oro" href="mailto:${contacto.email}">${Y.ICONOS.email}${contacto.email}</a>`);
        }
        if (contacto.telefono) {
          const soloNumeros = contacto.telefono.replace(/[^\d]/g, '');
          botones.push(`<a class="btn ${botones.length ? 'btn-linea' : 'btn-oro'}" href="https://wa.me/${soloNumeros}" target="_blank" rel="noopener">${Y.ICONOS.whatsapp}${contacto.telefono}</a>`);
        }
        if (usuarioIG) {
          botones.push(`<a class="btn ${botones.length ? 'btn-linea' : 'btn-oro'}" href="https://ig.me/m/${usuarioIG}" target="_blank" rel="noopener">${Y.ICONOS.instagram}Escribile por Instagram</a>`);
        }
        botonesWrap.innerHTML = botones.join('');
      }

      const htmlRedes = Object.entries(redes)
        .filter(([, url]) => url && url !== '#')
        .map(([clave, url]) => {
          const nombre = Y.NOMBRES_REDES[clave] || clave;
          return `<a class="red" href="${url}" target="_blank" rel="noopener" aria-label="${nombre}" title="${nombre}">${Y.ICONOS[clave] || nombre}</a>`;
        })
        .join('');
      redesWraps.forEach((w) => { w.innerHTML = htmlRedes; });
    })
    .catch(() => {});
})();
