// Landing page de un show puntual: se arma sola a partir de data/fechas.json
// (?id=... identifica cuál) y de un txt compartido en data/descripciones/
// con la descripción del show (ej: data/descripciones/patotera.txt).
//
// Portada del póster, en este orden:
//   1. el campo "portada" de la fecha, si tiene algo;
//   2. img/portadas/<show>.(webp|jpg|jpeg|png), ej: img/portadas/patotera.png;
//   3. si no hay ninguna, un póster tipográfico con el nombre del show.
(function () {
  const Y = window.YIPIO;
  const wrap = document.getElementById('eventoContenido');
  const id = new URLSearchParams(location.search).get('id');
  const EXTENSIONES = ['webp', 'jpg', 'jpeg', 'png'];
  const MAX_OTRAS = 4;

  function setMeta(elId, attr, valor) {
    const el = document.getElementById(elId);
    if (el) el.setAttribute(attr, valor);
  }

  async function buscarPortada(evento) {
    if (evento.portada) return evento.portada;
    if (!evento.show) return null;
    return Y.buscarConExtensiones(`img/portadas/${Y.slug(evento.show)}`, EXTENSIONES);
  }

  function posterTipografico(evento) {
    return `
      <div class="poster-tipo">
        <div class="reflector reflector--izq"></div>
        <div class="reflector reflector--purpura"></div>
        <div class="reflector reflector--der"></div>
        <div class="poster-tipo-contenido">
          <p class="poster-tipo-presenta">Yipio presenta</p>
          <p class="poster-tipo-show texto-oro">${evento.show || evento.titulo}</p>
          <p class="poster-tipo-sub">Stand-up comedy</p>
        </div>
      </div>`;
  }

  function botonCompra(evento) {
    if (evento.agotado) return '<span class="btn btn-apagado" aria-disabled="true">Entradas agotadas</span>';
    if (!evento.link) return '<span class="btn btn-apagado" aria-disabled="true">Próximamente</span>';
    return `<a href="${evento.link}" target="_blank" rel="noopener" class="btn btn-oro" id="btnComprarEntrada">Comprar entrada</a>`;
  }

  function miniTicket(f) {
    const { d, m } = Y.partes(f.fecha);
    const clases = ['ticket'];
    if (f.agotado) clases.push('ticket--agotado');
    if (f.destacado) clases.push('ticket--destacado');
    return `
      <article class="${clases.join(' ')}">
        <div class="ticket-in">
          <div class="ticket-talon">
            <span class="ticket-semana">${Y.diaSemana(f.fecha).slice(0, 3)}</span>
            <span class="ticket-dia texto-oro">${d}</span>
            <span class="ticket-mes">${Y.MESES[m - 1]}</span>
          </div>
          <div class="ticket-info">
            <h3 class="ticket-ciudad">${Y.bandera(f.pais)}<span>${f.ciudad}</span></h3>
            <p class="ticket-lugar">${f.lugar || ''}${f.hora ? ` · ${f.hora} hs` : ''}</p>
          </div>
          <div class="ticket-cta">
            ${f.agotado
              ? '<span class="btn btn-apagado" aria-disabled="true">Agotado</span>'
              : `<a class="btn btn-linea" href="evento.html?id=${encodeURIComponent(f.id)}">Ver función</a>`}
          </div>
          ${f.agotado ? '<span class="sello" aria-hidden="true">Agotado</span>' : ''}
        </div>
      </article>`;
  }

  function render(evento, descripcion, portada, otras) {
    const fecha = `${Y.fechaLarga(evento.fecha)}${evento.hora ? ` · ${evento.hora} hs` : ''}`;
    const direccion = [evento.lugar, evento.direccion2, evento.ciudad].filter(Boolean).join(', ');
    const mapaQuery = encodeURIComponent(`${evento.lugar || ''} ${evento.direccion2 || ''} ${evento.ciudad} ${evento.pais}`);
    const badges = Y.badges(evento, { incluirAgotado: true });
    const { d, m } = Y.partes(evento.fecha);
    const fechaCorta = `${Y.diaSemana(evento.fecha)} ${d} ${Y.MESES[m - 1]}${evento.hora ? ` · ${evento.hora}` : ''}`;

    document.title = `${evento.titulo} - Yipio`;
    setMeta('eventoDescMeta', 'content', `${evento.titulo} - ${fecha} - ${evento.lugar}, ${evento.ciudad}`);
    setMeta('ogTitle', 'content', `${evento.titulo} - Yipio`);
    setMeta('ogDescription', 'content', `${fecha} - ${evento.lugar}, ${evento.ciudad}`);
    if (portada) setMeta('ogImage', 'content', portada);

    wrap.innerHTML = `
      <div class="evento-layout">
        <div class="evento-columna">
          <article class="panel evento-principal">
            <div class="evento-poster"${portada ? ` style="background-image:url('${portada}')"` : ''}>
              ${portada ? '' : posterTipografico(evento)}
              <p class="evento-poster-caption">${fecha} · ${evento.lugar || evento.ciudad}</p>
            </div>
            <div class="evento-cuerpo">
              ${badges ? `<div class="evento-badges">${badges}</div>` : ''}
              <h1 class="evento-titulo">${evento.titulo}</h1>
              <p class="evento-dato evento-dato--fecha">${fecha}</p>
              <p class="evento-dato evento-dato--lugar">${Y.bandera(evento.pais)} ${direccion}</p>
              ${descripcion ? `<div class="evento-descripcion">${descripcion.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}</div>` : ''}
            </div>
          </article>

          <div class="evento-mapa">
            <iframe src="https://www.google.com/maps?q=${mapaQuery}&output=embed" loading="lazy" allowfullscreen title="Mapa de ${evento.lugar}"></iframe>
          </div>

          ${otras.length ? `
          <section class="evento-otras">
            <h2>Más funciones${evento.show ? ` de ${evento.show}` : ''}</h2>
            <div class="fechas-mes-lista">${otras.map(miniTicket).join('')}</div>
          </section>` : ''}
        </div>

        <aside class="panel evento-panel">
          <p class="kicker">Entradas</p>
          <div class="evento-panel-info">
            <p class="evento-panel-fecha">${fechaCorta}</p>
            <p class="evento-panel-lugar">${evento.lugar ? `${evento.lugar} · ` : ''}${evento.ciudad}</p>
          </div>
          <div class="cuenta" id="cuentaEvento"></div>
          ${botonCompra(evento)}
          <p class="evento-panel-nota">La compra se hace en la tiquetera oficial de la sala.</p>
        </aside>
      </div>`;

    if (!evento.agotado) Y.cuentaRegresiva(document.getElementById('cuentaEvento'), Y.inicioFuncion(evento));
  }

  Y.cargarJSON('data/fechas.json')
    .then(async (fechas) => {
      fechas = fechas.filter((f) => f.visible !== false);
      const evento = fechas.find((f) => f.id === id);
      if (!evento) throw new Error('evento no encontrado');

      const [descripcion, portada] = await Promise.all([
        evento.show
          ? fetch(`data/descripciones/${Y.slug(evento.show)}.txt`).then((r) => (r.ok ? r.text() : '')).catch(() => '')
          : '',
        buscarPortada(evento),
      ]);

      // Otras funciones del mismo show que todavía no pasaron
      const hoy = Y.hoyISO();
      const otras = fechas
        .filter((f) => f.id !== evento.id && f.fecha >= hoy && (!evento.show || f.show === evento.show))
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(0, MAX_OTRAS);

      render(evento, descripcion.trim(), portada, otras);
    })
    .catch(() => {
      wrap.innerHTML = `
        <div style="text-align:center;padding:80px 20px;">
          <p class="loading">No se encontró esta función.</p>
          <a class="btn btn-oro" href="index.html#fechas">Ver todas las fechas</a>
        </div>`;
    });
})();
