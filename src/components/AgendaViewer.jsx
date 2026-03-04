/**
 * AgendaViewer.jsx
 *
 * Vista completa de agenda (próximos + historial).
 * Migrado de Tailwind CSS a Bootstrap 5 para coherencia
 * con el resto del proyecto.
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AgendaViewer() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('agenda')
      .select('*')
      .order('fecha_evento', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setEventos(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
        <p className="text-muted mt-2 small">Cargando agenda...</p>
      </div>
    );
  }

  const hoy = new Date();

  const futuros = eventos.filter(e => {
    const fin = e.fecha_fin ? new Date(e.fecha_fin) : new Date(e.fecha_evento);
    return fin >= hoy;
  });

  const pasados = eventos.filter(e => {
    const fin = e.fecha_fin ? new Date(e.fecha_fin) : new Date(e.fecha_evento);
    return fin < hoy;
  }).reverse();

  return (
    <div className="container py-4">

      {/* Próximos Eventos */}
      <div className="mb-5">
        <div className="d-flex align-items-center gap-3 mb-4">
          <h2 className="fw-bold mb-0" style={{ color: 'var(--ufro-blue)' }}>Próximos Eventos</h2>
          <div style={{ height: 3, background: 'var(--ufro-pink)', opacity: 0.3, borderRadius: 10, flexGrow: 1 }}></div>
        </div>

        {futuros.length === 0 ? (
          <p className="text-muted fst-italic">No hay actividades próximas.</p>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {futuros.map(evento => (
              <div key={evento.id} className="col">
                <EventoCard evento={evento} esFuturo={true} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial */}
      {pasados.length > 0 && (
        <div>
          <div className="d-flex align-items-center gap-3 mb-4">
            <h3 className="fw-bold text-secondary mb-0">Historial de Eventos</h3>
            <div style={{ height: 2, background: '#dee2e6', borderRadius: 10, flexGrow: 1 }}></div>
          </div>
          <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-3" style={{ opacity: 0.8 }}>
            {pasados.map(evento => (
              <div key={evento.id} className="col">
                <EventoCard evento={evento} esFuturo={false} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de evento ──────────────────────────────────────────────────────
function EventoCard({ evento, esFuturo }) {
  const formatearFecha = (inicioStr, finStr) => {
    const inicio = new Date(inicioStr);
    const fin = finStr ? new Date(finStr) : null;
    const esSinHora = inicio.getHours() === 0 && inicio.getMinutes() === 0;
    const textoPendiente = 'Horario por confirmar';
    const dateOpts = { weekday: 'long', day: 'numeric', month: 'long' };
    const timeOpts = { hour: '2-digit', minute: '2-digit' };

    if (!fin) {
      return (
        <>
          <span className="text-capitalize">{inicio.toLocaleDateString('es-CL', dateOpts)}</span>
          <span className="d-block text-muted fw-normal">
            {esSinHora
              ? <em className="opacity-75">{textoPendiente}</em>
              : `${inicio.toLocaleTimeString('es-CL', timeOpts)} hrs`}
          </span>
        </>
      );
    }

    if (inicio.toDateString() === fin.toDateString()) {
      return (
        <>
          <span className="text-capitalize">{inicio.toLocaleDateString('es-CL', dateOpts)}</span>
          <span className="d-block text-muted fw-normal">
            {esSinHora
              ? <em className="opacity-75">{textoPendiente}</em>
              : `${inicio.toLocaleTimeString('es-CL', timeOpts)} – ${fin.toLocaleTimeString('es-CL', timeOpts)} hrs`}
          </span>
        </>
      );
    }

    return (
      <span className="text-capitalize">
        {inicio.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
        {' → '}
        {fin.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
      </span>
    );
  };

  // Color de badge por tipo
  const badgeColor = {
    Seminario: 'bg-purple',
    Taller: 'bg-warning text-dark',
    Noticia: 'bg-success',
  }[evento.tipo] || 'bg-primary';

  return (
    <div className={`card h-100 border-0 shadow-sm rounded-4 overflow-hidden evento-card
      ${esFuturo ? '' : 'grayscale-partial'}`}>

      {/* Imagen */}
      <div className="position-relative bg-light border-bottom" style={{ height: '300px' }}>
        {eventoSeleccionado.imagen_url ? (
          // Si hay imagen, solo se muestra la imagen
          <img
            src={eventoSeleccionado.imagen_url}
            className="w-100 h-100 object-fit-cover"
            alt={eventoSeleccionado.titulo}
          />
        ) : (
          // Si NO hay imagen, se muestra el placeholder
          <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary">
            <i className="bi bi-calendar-event fs-1 opacity-25"></i>
          </div>
        )}

        {/* El badge se mantiene sobre cualquiera de los dos estados */}
        <span className={`position-absolute top-0 end-0 m-3 badge ${getBadgeColor(eventoSeleccionado.tipo)} shadow-sm`}>
          {eventoSeleccionado.tipo || 'Evento'}
        </span>
      </div>

      {/* Cuerpo */}
      <div className="card-body p-3 d-flex flex-column">
        <div className="small fw-bold text-uppercase mb-2 lh-sm" style={{ color: 'var(--ufro-blue)', letterSpacing: '0.5px' }}>
          {formatearFecha(evento.fecha_evento, evento.fecha_fin)}
        </div>

        <h6 className="fw-bold text-dark mb-2 lh-sm">{evento.titulo}</h6>

        {evento.lugar && (
          <p className="small text-muted mb-2">
            <i className="bi bi-geo-alt me-1"></i>{evento.lugar}
          </p>
        )}

        {evento.descripcion && (
          <div
            className="text-muted small line-clamp-3 mb-3 flex-grow-1"
            dangerouslySetInnerHTML={{ __html: evento.descripcion }}
          />
        )}

        {evento.link_externo && (
          <a href={evento.link_externo} target="_blank" rel="noopener noreferrer"
            className="btn btn-sm btn-outline-primary rounded-pill w-100 mt-auto fw-semibold"
            style={{ borderColor: 'var(--ufro-blue)', color: 'var(--ufro-blue)' }}>
            {evento.tipo === 'Noticia' ? 'Leer más' : 'Inscribirse'}
          </a>
        )}
      </div>
    </div>
  );
}