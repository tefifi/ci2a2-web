import { Suspense, lazy, useMemo, useState } from 'react';
import { useAdminCRUD }   from './hooks/useAdminCRUD';   // src/components/admin/hooks/
import { useImageUpload } from './hooks/useImageUpload'; // src/components/admin/hooks/
import {
  AdminPageHeader, FormHeader, FormActions,
  ListaAcciones, ListaVacia, SidebarCard,
  AdminSpinner, ImageUploadZone, ModalConfirmar,
} from './components/AdminUI';                           // src/components/admin/components/

const Editor = lazy(() =>
  import('react-simple-wysiwyg').then(m => ({ default: m.default || m }))
);

// ─── Helpers de fecha ─────────────────────────────────────────────────────────
const extractDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const extractTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const combineDateTime = (fecha, hora) => {
  if (!fecha) return null;
  // Si no hay hora ingresada, guardamos sin hora (00:00 UTC) para que AgendaViewer
  // lo detecte como "Horario por confirmar"
  if (!hora) return new Date(`${fecha}T00:00:00.000Z`).toISOString();
  // Si hay hora, la interpretamos como hora local de Chile (UTC-3 o UTC-4)
  // Usamos Date con zona horaria local del navegador
  const dt = new Date(`${fecha}T${hora}:00`);
  return dt.toISOString();
};

// ─── Form inicial ─────────────────────────────────────────────────────────────
const FORM_INICIAL = {
  titulo: '', descripcion: '', tipo: '', lugar: '',
  link_externo: '', imagen_url: '',
  fecha_inicio: '', hora_inicio: '',
  fecha_fin: '',   hora_fin: '',
};

export default function AdminAgenda() {
  const crud = useAdminCRUD('agenda', FORM_INICIAL, {
    ordenarPor: 'fecha_evento',
    mensajeCreado:    '¡Evento creado correctamente!',
    mensajeEditado:   '¡Evento actualizado correctamente!',
    mensajeEliminado: 'Evento eliminado correctamente.',
    // Transforma los campos de fecha antes de enviar a Supabase
    transformarAntes: (datos) => {
      const { fecha_inicio, hora_inicio, fecha_fin, hora_fin, ...rest } = datos;
      return {
        ...rest,
        fecha_evento: combineDateTime(fecha_inicio, hora_inicio),
        fecha_fin:    fecha_fin ? combineDateTime(fecha_fin, hora_fin) : null,
      };
    },
  });

  const { subiendo, uploadImage } = useImageUpload('agenda', 'agenda_');

  const [sinHoraInicio, setSinHoraInicio] = useState(false);
  const [sinHoraFin, setSinHoraFin]       = useState(false);

  // Sugerencias dinámicas desde los datos existentes
  const sugerencias = useMemo(() => {
    const lugares = new Set();
    const tipos   = new Set(['Seminario', 'Workshop', 'Charla', 'Noticia']);
    crud.lista.forEach(e => {
      if (e.lugar) lugares.add(e.lugar);
      if (e.tipo)  tipos.add(e.tipo);
    });
    return { lugares: [...lugares].sort(), tipos: [...tipos].sort() };
  }, [crud.lista]);

  // Cargar evento para editar — mapea los campos de fecha al formulario
  const cargarParaEditar = (evento) => {
    crud.setForm({
      titulo:       evento.titulo       || '',
      descripcion:  evento.descripcion  || '',
      tipo:         evento.tipo         || '',
      lugar:        evento.lugar        || '',
      link_externo: evento.link_externo || '',
      imagen_url:   evento.imagen_url   || '',
      fecha_inicio: extractDate(evento.fecha_evento),
      hora_inicio:  extractTime(evento.fecha_evento),
      fecha_fin:    extractDate(evento.fecha_fin),
      hora_fin:     extractTime(evento.fecha_fin),
    });
    crud.setIdEdicion(evento.id);
    // Detectar si tenía hora guardada
    const d = new Date(evento.fecha_evento);
    const noTeniaHora = d.getUTCHours() === 0 && d.getUTCMinutes() === 0;
    setSinHoraInicio(noTeniaHora);
    if (evento.fecha_fin) {
      const df = new Date(evento.fecha_fin);
      setSinHoraFin(df.getUTCHours() === 0 && df.getUTCMinutes() === 0);
    } else {
      setSinHoraFin(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpload = async (file) => {
    const url = await uploadImage(file);
    if (url) crud.setField('imagen_url', url);
    else     crud.mostrarMensaje?.('danger', 'Error al subir imagen');
  };

  return (
    <>
      <ModalConfirmar {...crud.modalProps} />
      <AdminPageHeader
        titulo="Gestión de Agenda"
        mensaje={crud.mensaje}
        onClose={crud.limpiarMensaje}
      />

      <div className="row g-4">

        {/* ── FORMULARIO ── */}
        <div className="col-lg-8">
          <form
            onSubmit={crud.handleSubmit}
            className="card p-4 shadow-sm border-0"
            id="form-top"
          >
            <FormHeader
              idEdicion={crud.idEdicion}
              labelNuevo="Nuevo Evento"
              labelEditar="Editar Evento"
            />

            <ImageUploadZone
              image={crud.form.imagen_url}
              onUpload={handleUpload}
              onRemove={() => crud.setField('imagen_url', '')}
              subiendo={subiendo}
              variante="banner"
              label="Flyer / Portada"
              hint="Recomendado: 1280×600 px"
            />

            <div className="row g-3">

              {/* Título */}
              <div className="col-12">
                <label className="form-label fw-bold small text-secondary">
                  Título <span className="text-danger">*</span>
                </label>
                <input
                  type="text" className="form-control fw-bold"
                  name="titulo" required
                  value={crud.form.titulo}
                  onChange={crud.handleChange}
                  placeholder="Ej: Seminario de Inteligencia Artificial"
                />
              </div>

              {/* Fechas */}
              <div className="col-md-6">
                <div className="p-3 bg-light rounded border">
                  <div className="row g-2 mb-2">
                    <div className="col-12 text-secondary fw-bold small">
                      <i className="bi bi-play-circle me-1"></i>Inicio
                    </div>
                    <div className="col-7">
                      <input type="date" className="form-control form-control-sm"
                        name="fecha_inicio" value={crud.form.fecha_inicio}
                        onChange={crud.handleChange} />
                    </div>
                    <div className="col-5">
                      <input type="time" className="form-control form-control-sm"
                        name="hora_inicio" value={crud.form.hora_inicio}
                        onChange={crud.handleChange}
                        disabled={sinHoraInicio} />
                    </div>
                    <div className="col-12">
                      <div className="form-check form-switch mt-1">
                        <input className="form-check-input" type="checkbox" id="sinHoraInicio"
                          checked={sinHoraInicio}
                          onChange={(e) => {
                            setSinHoraInicio(e.target.checked);
                            if (e.target.checked) crud.setField('hora_inicio', '');
                          }} />
                        <label className="form-check-label small text-secondary" htmlFor="sinHoraInicio">
                          Horario por confirmar
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="row g-2">
                    <div className="col-12 text-secondary fw-bold small mt-1">
                      <i className="bi bi-stop-circle me-1"></i>Fin (Opcional)
                    </div>
                    <div className="col-7">
                      <input type="date" className="form-control form-control-sm"
                        name="fecha_fin" value={crud.form.fecha_fin}
                        onChange={crud.handleChange} />
                    </div>
                    <div className="col-5">
                      <input type="time" className="form-control form-control-sm"
                        name="hora_fin" value={crud.form.hora_fin}
                        onChange={crud.handleChange}
                        disabled={sinHoraFin} />
                    </div>
                    <div className="col-12">
                      <div className="form-check form-switch mt-1">
                        <input className="form-check-input" type="checkbox" id="sinHoraFin"
                          checked={sinHoraFin}
                          onChange={(e) => {
                            setSinHoraFin(e.target.checked);
                            if (e.target.checked) crud.setField('hora_fin', '');
                          }} />
                        <label className="form-check-label small text-secondary" htmlFor="sinHoraFin">
                          Hora fin por confirmar
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tipo y Lugar */}
              <div className="col-md-6">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Tipo de Evento</label>
                    <input className="form-control" list="datalistTipos" name="tipo"
                      placeholder="Ej: Seminario, Taller..."
                      value={crud.form.tipo} onChange={crud.handleChange} />
                    <datalist id="datalistTipos">
                      {sugerencias.tipos.map((t, i) => <option key={i} value={t} />)}
                    </datalist>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Lugar</label>
                    <input className="form-control" list="datalistLugares" name="lugar"
                      placeholder="Ej: Auditorio Central"
                      value={crud.form.lugar} onChange={crud.handleChange} />
                    <datalist id="datalistLugares">
                      {sugerencias.lugares.map((l, i) => <option key={i} value={l} />)}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="col-12">
                <label className="form-label fw-bold small text-secondary">Descripción</label>
                <div className="border rounded bg-light overflow-hidden">
                  <Suspense fallback={<div className="p-3 text-center text-muted">Cargando editor...</div>}>
                    <Editor
                      value={crud.form.descripcion}
                      onChange={(e) => crud.setField('descripcion', e.target.value)}
                      containerProps={{ style: { minHeight: '150px' } }}
                    />
                  </Suspense>
                </div>
              </div>

              {/* Enlace externo */}
              <div className="col-12">
                <label className="form-label fw-bold small text-secondary">Enlace (Opcional)</label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-secondary">
                    <i className="bi bi-link-45deg"></i>
                  </span>
                  <input type="text" className="form-control"
                    name="link_externo" value={crud.form.link_externo}
                    onChange={crud.handleChange} placeholder="https://..." />
                </div>
              </div>

            </div>

            <FormActions
              idEdicion={crud.idEdicion}
              loading={crud.loading}
              onCancel={() => { crud.resetForm(); setSinHoraInicio(false); setSinHoraFin(false); }}
              labelGuardar="Agendar Evento"
              labelEditar="Guardar Cambios"
            />
          </form>
        </div>

        {/* ── LISTA LATERAL ── */}
        <div className="col-lg-4">
          <SidebarCard
            titulo="Historial"
            count={crud.lista.length}
            maxHeight="calc(100vh - 200px)"
          >
            {crud.loading && <AdminSpinner texto="Cargando eventos..." />}

            {crud.lista.map(evento => (
              <div
                key={evento.id}
                className={`list-group-item d-flex gap-3 align-items-center p-3 transition-all
                  ${crud.idEdicion === evento.id ? 'bg-primary bg-opacity-10' : ''}`}
                style={crud.idEdicion === evento.id
                  ? { borderLeft: '4px solid #0d6efd' } : {}}
              >
                {/* Miniatura */}
                <div
                  style={{ width: 50, height: 50 }}
                  className="rounded overflow-hidden bg-light flex-shrink-0 border d-flex align-items-center justify-content-center"
                >
                  {evento.imagen_url
                    ? <img src={evento.imagen_url} className="w-100 h-100 object-fit-cover" alt="" />
                    : <i className="bi bi-calendar text-muted"></i>
                  }
                </div>

                {/* Info */}
                <div className="flex-grow-1 overflow-hidden">
                  <h6 className="mb-0 fw-bold text-truncate text-dark small">{evento.titulo}</h6>
                  <div className="small text-muted">
                    {new Date(evento.fecha_evento).toLocaleDateString()}
                    <span className="ms-1 text-primary">
                      {new Date(evento.fecha_evento).toLocaleTimeString([], {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Botones */}
                <ListaAcciones
                  onEdit={() => cargarParaEditar(evento)}
                  onDelete={() => crud.handleDelete(evento.id, '¿Eliminar este evento?')}
                  orientacion="column"
                />
              </div>
            ))}

            {!crud.loading && crud.lista.length === 0 && (
              <ListaVacia texto="No hay eventos registrados aún." />
            )}
          </SidebarCard>
        </div>

      </div>
    </>
  );
}