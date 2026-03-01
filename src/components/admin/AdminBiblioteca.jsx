import { useAdminCRUD }   from './hooks/useAdminCRUD';
import { useImageUpload } from './hooks/useImageUpload';
import {
  AdminPageHeader, FormHeader, FormActions,
  ListaAcciones, ListaVacia, SidebarCard,
  AdminSpinner, ImageUploadZone,
} from './components/AdminUI';

const FORM_INICIAL = {
  titulo: '', descripcion: '', url: '', imagen_url: '',
  tipo: 'link', autor: '', destacado: false,
};

const getYoutubeThumbnail = (url) => {
  if (!url) return null;
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2].length === 11
    ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`
    : null;
};

const TIPO_INFO = {
  link:   { icon: 'bi-link-45deg',        color: '#0d6efd', label: 'Enlace'   },
  video:  { icon: 'bi-play-circle-fill',  color: '#dc3545', label: 'Video'    },
  centro: { icon: 'bi-building',          color: '#6f42c1', label: 'Centro'   },
  paper:  { icon: 'bi-file-earmark-text', color: '#198754', label: 'Paper'    },
};

export default function AdminBiblioteca() {
  const crud = useAdminCRUD('biblioteca', FORM_INICIAL, {
    mensajeCreado:    'Recurso creado con éxito.',
    mensajeEditado:   'Recurso actualizado correctamente.',
    mensajeEliminado: 'Recurso eliminado.',
  });

  const { subiendo, uploadImage } = useImageUpload('biblioteca-img', 'biblio_');

  const handleImageUpload = async (file) => {
    const url = await uploadImage(file);
    if (url) crud.setField('imagen_url', url);
  };

  const handleSubmit = (e) => {
    if (!crud.form.titulo || !crud.form.url) {
      e.preventDefault();
      crud.mostrarMensaje?.('danger', 'Título y URL son obligatorios.');
      return;
    }
    crud.handleSubmit(e);
  };

  // ── Zona de miniatura dinámica ─────────────────────────────────────────────
  const ytThumb = crud.form.tipo === 'video' ? getYoutubeThumbnail(crud.form.url) : null;
  const hayYtSinManual = !!ytThumb && !crud.form.imagen_url;

  return (
    <div className="container-fluid p-0 mb-5" id="top-anchor">
      <AdminPageHeader
        titulo="Gestión de Biblioteca"
        mensaje={crud.mensaje}
        onClose={crud.limpiarMensaje}
      />

      <div className="row g-4">
        {/* ── FORMULARIO ── */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100" id="form-top">
            <div className="card-body p-4">
              <FormHeader
                idEdicion={crud.idEdicion}
                labelNuevo="Nuevo Recurso"
                labelEditar="Editar Recurso"
              />

              <form onSubmit={handleSubmit}>
                <div className="row g-3">

                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">
                      Título <span className="text-danger">*</span>
                    </label>
                    <input type="text" className="form-control bg-light border-0" required
                      placeholder="Ej: Webinar sobre IA..."
                      name="titulo" value={crud.form.titulo} onChange={crud.handleChange} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Tipo</label>
                    <select className="form-select bg-light border-0"
                      name="tipo" value={crud.form.tipo} onChange={crud.handleChange}>
                      <option value="link">Enlace Web</option>
                      <option value="video">Video (YouTube)</option>
                      <option value="centro">Centro Investigación</option>
                      <option value="paper">Paper / PDF</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Autor / Fuente</label>
                    <input type="text" className="form-control bg-light border-0"
                      placeholder="Ej: CI2A2"
                      name="autor" value={crud.form.autor} onChange={crud.handleChange} />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">
                      Enlace / URL <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0 text-secondary">
                        <i className="bi bi-link-45deg"></i>
                      </span>
                      <input type="url" className="form-control bg-light border-0" required
                        placeholder="https://..."
                        name="url" value={crud.form.url} onChange={crud.handleChange} />
                    </div>
                  </div>

                  {/* Descripción + Miniatura */}
                  <div className="col-md-7 d-flex flex-column">
                    <label className="form-label fw-bold small text-secondary">Descripción</label>
                    <textarea className="form-control bg-light border-0 flex-grow-1"
                      placeholder="Resumen del recurso..." style={{ minHeight: 160 }}
                      name="descripcion" value={crud.form.descripcion} onChange={crud.handleChange} />
                  </div>

                  <div className="col-md-5 d-flex flex-column">
                    <label className="form-label fw-bold small text-secondary">Miniatura</label>

                    {hayYtSinManual ? (
                      // ── Preview YouTube con overlay de reemplazo ──────────
                      <div className="position-relative rounded-3 overflow-hidden border bg-dark flex-grow-1"
                        style={{ aspectRatio: '16/9', minHeight: 100 }}>

                        <img src={ytThumb} className="w-100 h-100 object-fit-cover opacity-75" alt="YouTube" />

                        {/* Badge YouTube esquina */}
                        <span className="position-absolute top-0 start-0 m-2 badge bg-danger"
                          style={{ fontSize: '0.6rem', zIndex: 2 }}>
                          <i className="bi bi-youtube me-1"></i>YouTube Auto
                        </span>

                        {/* Overlay hover con botón de reemplazo */}
                        <label
                          className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column
                            align-items-center justify-content-center gap-1 text-white"
                          style={{
                            cursor: 'pointer',
                            background: 'rgba(0,0,0,0.0)',
                            transition: 'background 0.25s',
                            zIndex: 3,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.52)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.0)'}
                        >
                          <input type="file" className="d-none" accept="image/*"
                            onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0])} />

                          {subiendo ? (
                            <>
                              <div className="spinner-border spinner-border-sm"></div>
                              <small className="fw-bold mt-1">Subiendo...</small>
                            </>
                          ) : (
                            <>
                              <div className="rounded-circle bg-white bg-opacity-25 p-2 mb-1"
                                style={{ lineHeight: 1 }}>
                                <i className="bi bi-camera-fill fs-5"></i>
                              </div>
                              <small className="fw-bold" style={{ fontSize: '0.75rem' }}>
                                Usar imagen propia
                              </small>
                              <small className="opacity-75" style={{ fontSize: '0.65rem' }}>
                                Arrastra o haz clic
                              </small>
                            </>
                          )}
                        </label>
                      </div>
                    ) : (
                      // ── Upload normal ──────────────────────────────────────
                      <ImageUploadZone
                        image={crud.form.imagen_url}
                        onUpload={handleImageUpload}
                        onRemove={() => crud.setField('imagen_url', '')}
                        subiendo={subiendo}
                        variante="cuadrado"
                        hint="Recomendado 16:9"
                      />
                    )}

                    <p className="form-text mb-0 mt-1" style={{ fontSize: '0.68rem' }}>
                      {hayYtSinManual
                        ? 'Pasa el cursor sobre la imagen para reemplazarla.'
                        : 'Arrastra, pega (Ctrl+V) o haz clic.'}
                    </p>
                  </div>

                  <div className="col-12">
                    <FormActions
                      idEdicion={crud.idEdicion}
                      loading={crud.loading || subiendo}
                      onCancel={crud.resetForm}
                      labelGuardar="Crear Recurso"
                      labelEditar="Guardar Cambios"
                    />
                  </div>

                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ── HISTORIAL — mismo patrón que Noticias / Proyectos ── */}
        <div className="col-lg-4">
          <SidebarCard titulo="Publicados" count={crud.lista.length} maxHeight="600px">
            {crud.loading && <AdminSpinner texto="Cargando recursos..." />}

            {crud.lista.map(item => {
              const ytThumbItem = item.tipo === 'video' ? getYoutubeThumbnail(item.url) : null;
              const thumb       = item.imagen_url || ytThumbItem;
              const info        = TIPO_INFO[item.tipo] ?? TIPO_INFO.link;

              return (
                <div key={item.id}
                  className={`list-group-item d-flex gap-3 align-items-center p-3 transition-all
                    ${crud.idEdicion === item.id ? 'bg-primary bg-opacity-10' : ''}`}
                  style={crud.idEdicion === item.id ? { borderLeft: '4px solid #0d6efd' } : {}}
                >
                  {/* Miniatura / ícono */}
                  <div style={{ width: 80, height: 50 }}
                    className="rounded overflow-hidden bg-light flex-shrink-0 d-flex align-items-center justify-content-center border">
                    {thumb
                      ? <img src={thumb} className="w-100 h-100 object-fit-cover" alt="" />
                      : <i className={`bi ${info.icon}`} style={{ color: info.color, fontSize: '1.4rem' }}></i>
                    }
                  </div>

                  {/* Texto */}
                  <div className="flex-grow-1 overflow-hidden">
                    <h6 className={`mb-0 fw-bold text-truncate small
                      ${crud.idEdicion === item.id ? 'text-primary' : 'text-dark'}`}>
                      {item.titulo}
                    </h6>
                    <small className="text-muted d-flex align-items-center gap-1 mt-1"
                      style={{ fontSize: '0.72rem' }}>
                      <i className={`bi ${info.icon}`} style={{ color: info.color }}></i>
                      {info.label}{item.autor ? ` · ${item.autor}` : ''}
                    </small>
                  </div>

                  {/* Botones */}
                  <ListaAcciones
                    onEdit={() => crud.handleEdit(item)}
                    onDelete={() => crud.handleDelete(item.id, '¿Eliminar recurso?')}
                  />
                </div>
              );
            })}

            {!crud.loading && crud.lista.length === 0 && (
              <ListaVacia texto="No hay recursos publicados." />
            )}
          </SidebarCard>
        </div>
      </div>
    </div>
  );
}