// Fechas: se editan en data/fechas.json, esta página se actualiza sola.
// Las funciones que ya pasaron se ocultan y el resto se agrupa por mes.
//
// Campos opcionales de cada fecha:
//   "agotado": true       -> sello AGOTADO y botón desactivado
//   "ultimas": true       -> badge "Últimas entradas" que late
//   "destacado": "Estreno" (o true) -> ticket dorado con brillo y badge
//   "visible": false      -> no sale en la web (sí en flyer-maker)
(function () {
  const Y = window.YIPIO;
  const wrap = document.getElementById('fechasList');

  function claveMes(iso) {
    return iso.slice(0, 7);
  }

  function tituloMes(iso) {
    const { y, m } = Y.partes(iso);
    return `${Y.MESES_LARGO[m - 1]} ${y}`;
  }

  function botonEntradas(f, config, texto) {
    if (f.agotado) return '<span class="btn btn-apagado" aria-disabled="true">Agotado</span>';
    if (!f.link) return '<span class="btn btn-apagado" aria-disabled="true">Próximamente</span>';
    return `<a class="btn btn-oro" href="${Y.linkEntradas(f, config)}"${Y.atributosLink(config)}>${texto}</a>`;
  }

  function ticket(f, config) {
    const { d, m } = Y.partes(f.fecha);
    const clases = ['ticket'];
    if (f.agotado) clases.push('ticket--agotado');
    if (f.destacado) clases.push('ticket--destacado');
    const badges = Y.badges(f);

    return `
      <article class="${clases.join(' ')}">
        <div class="ticket-in">
          <div class="ticket-talon">
            <span class="ticket-semana">${Y.diaSemana(f.fecha).slice(0, 3)}</span>
            <span class="ticket-dia texto-oro">${d}</span>
            <span class="ticket-mes">${Y.MESES[m - 1]}</span>
          </div>
          <div class="ticket-info">
            ${badges ? `<div class="ticket-badges">${badges}</div>` : ''}
            <h4 class="ticket-ciudad">${Y.bandera(f.pais)}<span>${f.ciudad}</span></h4>
            <p class="ticket-lugar">${f.lugar || ''}${f.hora ? ` · ${f.hora} hs` : ''}</p>
            ${f.show ? `<p class="ticket-show">${f.show}</p>` : ''}
          </div>
          <div class="ticket-cta">${botonEntradas(f, config, 'Entradas')}</div>
          ${f.agotado ? '<span class="sello" aria-hidden="true">Agotado</span>' : ''}
        </div>
      </article>`;
  }


  Promise.all([
    Y.cargarJSON('data/fechas.json'),
    Y.cargarJSON('data/config.json').catch(() => ({})),
  ])
    .then(([fechas, config]) => {
      const hoy = Y.hoyISO();
      const proximas = fechas
        .filter((f) => f.visible !== false && f.fecha >= hoy)
        .sort((a, b) => `${a.fecha} ${a.hora || ''}`.localeCompare(`${b.fecha} ${b.hora || ''}`));

      if (!proximas.length) {
        wrap.innerHTML = '<p class="loading">No hay fechas próximas por el momento. ¡Muy pronto nuevas funciones!</p>';
        return;
      }

      const grupos = [];
      let grupoActual = null;
      proximas.forEach((f) => {
        const clave = claveMes(f.fecha);
        if (!grupoActual || grupoActual.clave !== clave) {
          grupoActual = { clave, titulo: tituloMes(f.fecha), items: [] };
          grupos.push(grupoActual);
        }
        grupoActual.items.push(f);
      });

      wrap.innerHTML = grupos
        .map(
          (grupo) => `
        <div class="fechas-mes">
          <h3 class="fechas-mes-titulo">${grupo.titulo}</h3>
          <div class="fechas-mes-lista">
            ${grupo.items.map((f) => ticket(f, config)).join('')}
          </div>
        </div>`
        )
        .join('');
    })
    .catch(() => {
      wrap.innerHTML = '<p class="loading">No se pudieron cargar las fechas.</p>';
    });
})();
