import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAdminCRUD } from './hooks/useAdminCRUD';
import {
  AdminPageHeader, FormHeader, FormActions,
  ListaAcciones, ListaVacia, SidebarCard,
  ModalConfirmar,
} from './components/AdminUI';

const BUCKET = 'transparencia-docs';

const FORM_INICIAL = {
  anio:            new Date().getFullYear(),
  concurso:        '',
  titulo:          '',
  descripcion:     '',
  director:        '',
  participantes:   '',
  monto:           '',
  link_resolucion: '',
};

export default function AdminTransparencia() {
  const crud = useAdminCRUD('proyectos_adjudicados', FORM_INICIAL, {
    mensajeCreado:    '¡Proyecto creado correctamente!',
    mensajeEditado:   '¡Proyecto actualizado correctamente!',
    mensajeEliminado: 'Proyecto eliminado correctamente.',
  });

  const [modoDoc, setModoDoc]       = useState('url');  // 'url' | 'pdf'
  const [archivoPdf, setArchivoPdf] = useState(null);
  const [subiendo, setSubiendo]     = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef                    = useRef(null);
  const [mensajeLocal, setMensajeLocal] = useState(null);

  // Nombre legible del PDF ya guardado en Storage
  const nombreArchivoActual = crud.form.link_resolucion?.includes(BUCKET)
    ? decodeURIComponent(crud.form.link_resolucion.split('/').pop().split('?')[0])
    : null;

  // ── Subir PDF a Supabase Storage ──────────────────────────────────────────
  const subirPdf = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setMensajeLocal({ tipo: 'danger', texto: 'Solo se aceptan archivos PDF.' });
      return;
    }
    setSubiendo(true);
    setMensajeLocal(null);
    try {
      const nombre = `doc_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      console.log('[AdminTransparencia] Subiendo:', nombre, 'al bucket:', BUCKET);
      const { error } = await supabase.storage.from(BUCKET).upload(nombre, file, {
        contentType: 'application/pdf',
        upsert: false,
      });
      if (error) {
        console.error('[AdminTransparencia] Error Storage:', error);
        throw error;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(nombre);
      crud.setField('link_resolucion', data.publicUrl);
      setArchivoPdf(file);
      setMensajeLocal({ tipo: 'success', texto: `✓ "${file.name}" subido correctamente.` });
    } catch (err) {
      console.error('[AdminTransparencia] Error al subir PDF:', err);
      setMensajeLocal({ tipo: 'danger', texto: 'Error al subir el PDF: ' + (err.message || JSON.stringify(err)) });
    } finally {
      setSubiendo(false);
    }
  };

  // ── Reset también limpia estado de PDF ────────────────────────────────────
  const handleReset = () => {
    crud.resetForm();
    setArchivoPdf(null);
    setModoDoc('url');
  };

  // ── Al editar, detectar modo según la URL guardada ────────────────────────
  const handleEdit = (item) => {
    crud.handleEdit(item);
    setModoDoc(item.link_resolucion?.includes(BUCKET) ? 'pdf' : 'url');
    setArchivoPdf(null);
  };

  return (
    <>
      <ModalConfirmar {...crud.modalProps} />

      <AdminPageHeader
        titulo="Gestión de Transparencia"
        mensaje={crud.mensaje}
        onClose={crud.limpiarMensaje}
      />

      <div className="row g-4 align-items-start">

        {/* ── FORMULARIO ── */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 p-4 sticky-top" style={{ top: '2rem', zIndex: 10 }}>
            <FormHeader
              idEdicion={crud.idEdicion}
              labelNuevo="Nuevo Proyecto"
              labelEditar="Editar Proyecto"
            />

            <form onSubmit={crud.handleSubmit} className="d-flex flex-column gap-3">

              {/* Año + Concurso */}
              <div className="row g-2">
                <div className="col-4">
                  <label className="small fw-bold text-secondary">Año</label>
                  <input type="number" className="form-control" name="anio" required
                    value={crud.form.anio} onChange={crud.handleChange} />
                </div>
                <div className="col-8">
                  <label className="small fw-bold text-secondary">Concurso / Fuente</label>
                  <input type="text" className="form-control" name="concurso" required
                    placeholder="Ej: Fondequip Mayor 2025"
                    value={crud.form.concurso} onChange={crud.handleChange} />
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="small fw-bold text-secondary">Título del Proyecto</label>
                <input type="text" className="form-control" name="titulo" required
                  value={crud.form.titulo} onChange={crud.handleChange} />
              </div>

              {/* Descripción */}
              <div>
                <label className="small fw-bold text-secondary">Descripción Detallada</label>
                <textarea className="form-control" rows="4" name="descripcion" required
                  value={crud.form.descripcion} onChange={crud.handleChange} />
              </div>

              {/* Director + Monto */}
              <div className="row g-2">
                <div className="col-6">
                  <label className="small fw-bold text-secondary">Director(a)</label>
                  <input type="text" className="form-control" name="director" required
                    value={crud.form.director} onChange={crud.handleChange} />
                </div>
                <div className="col-6">
                  <label className="small fw-bold text-secondary">Monto Subsidio</label>
                  <input type="text" className="form-control" name="monto"
                    placeholder="$0.000.000"
                    value={crud.form.monto} onChange={crud.handleChange} />
                </div>
              </div>

              {/* Participantes */}
              <div>
                <label className="small fw-bold text-secondary">Participantes (separados por coma)</label>
                <textarea className="form-control" rows="2" name="participantes"
                  value={crud.form.participantes} onChange={crud.handleChange} />
              </div>

              {/* ── Documentación ── */}
              <div>
                <label className="small fw-bold text-secondary d-block mb-2">Documentación</label>

                {/* Toggle URL / PDF */}
                <div className="d-flex gap-2 mb-3">
                  <button type="button"
                    className={`btn btn-sm px-3 fw-bold ${modoDoc === 'url' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={{ borderRadius: '8px' }}
                    onClick={() => { setModoDoc('url'); setArchivoPdf(null); }}>
                    <i className="bi bi-link-45deg me-1"></i>URL externa
                  </button>
                  <button type="button"
                    className={`btn btn-sm px-3 fw-bold ${modoDoc === 'pdf' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    style={{ borderRadius: '8px' }}
                    onClick={() => setModoDoc('pdf')}>
                    <i className="bi bi-file-earmark-pdf me-1"></i>Subir PDF
                  </button>
                </div>

                {/* Modo URL */}
                {modoDoc === 'url' && (
                  <div className="input-group">
                    <span className="input-group-text bg-white text-secondary">
                      <i className="bi bi-link-45deg"></i>
                    </span>
                    <input type="url" className="form-control" name="link_resolucion"
                      placeholder="https://..."
                      value={crud.form.link_resolucion}
                      onChange={crud.handleChange} />
                  </div>
                )}

                {/* Modo PDF */}
                {modoDoc === 'pdf' && (
                  <div>
                    {mensajeLocal && (
                      <div className={`alert alert-${mensajeLocal.tipo} py-2 small border-0 mb-2`}>
                        <i className={`bi ${mensajeLocal.tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                        {mensajeLocal.texto}
                      </div>
                    )}
                    <div
                      className={`rounded-3 border d-flex flex-column align-items-center justify-content-center p-4 text-center
                        ${isDragging
                          ? 'border-danger bg-danger bg-opacity-10'
                          : archivoPdf || nombreArchivoActual
                            ? 'border-success bg-success bg-opacity-10'
                            : 'bg-light border-secondary-subtle'}`}
                      style={{ borderStyle: 'dashed', minHeight: '110px', cursor: 'pointer', transition: 'all 0.2s' }}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault(); setIsDragging(false);
                        const f = e.dataTransfer.files[0];
                        if (f) subirPdf(f);
                      }}
                      onClick={() => inputRef.current?.click()}
                    >
                      <input type="file" ref={inputRef} className="d-none" accept="application/pdf"
                        onChange={(e) => e.target.files[0] && subirPdf(e.target.files[0])} />

                      {subiendo ? (
                        <>
                          <div className="spinner-border spinner-border-sm text-danger mb-2"></div>
                          <small className="text-muted fw-bold">Subiendo PDF...</small>
                        </>
                      ) : archivoPdf ? (
                        <>
                          <i className="bi bi-file-earmark-check-fill text-success fs-3 mb-1"></i>
                          <p className="mb-0 fw-bold small text-success text-truncate w-100 px-2">{archivoPdf.name}</p>
                          <small className="text-muted">Subido correctamente</small>
                        </>
                      ) : nombreArchivoActual ? (
                        <>
                          <i className="bi bi-file-earmark-pdf-fill text-danger fs-3 mb-1"></i>
                          <p className="mb-0 fw-bold small text-truncate w-100 px-2">{nombreArchivoActual}</p>
                          <small className="text-muted opacity-75">Haz clic para reemplazar</small>
                        </>
                      ) : (
                        <>
                          <i className={`bi bi-file-earmark-arrow-up fs-3 mb-2 ${isDragging ? 'text-danger' : 'text-muted opacity-50'}`}></i>
                          <p className="mb-0 fw-bold small text-muted">Arrastra el PDF aquí</p>
                          <small className="text-muted opacity-75">o haz clic para buscar</small>
                        </>
                      )}
                    </div>

                    {/* Enlace al archivo actual */}
                    {crud.form.link_resolucion && !subiendo && (
                      <div className="mt-2 d-flex align-items-center gap-2">
                        <i className="bi bi-check-circle-fill text-success small"></i>
                        <a href={crud.form.link_resolucion} target="_blank" rel="noreferrer"
                          className="small text-primary text-decoration-none">
                          <i className="bi bi-box-arrow-up-right me-1"></i>Ver documento actual
                        </a>
                        <button type="button" className="btn btn-link btn-sm text-danger p-0 ms-auto"
                          onClick={() => { crud.setField('link_resolucion', ''); setArchivoPdf(null); }}>
                          <i className="bi bi-x-circle me-1"></i>Quitar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <FormActions
                idEdicion={crud.idEdicion}
                loading={crud.loading || subiendo}
                onCancel={handleReset}
                labelGuardar="Publicar en Transparencia"
                labelEditar="Guardar Cambios"
              />
            </form>
          </div>
        </div>

        {/* ── LISTA LATERAL ── */}
        <div className="col-lg-4">
          <SidebarCard titulo="Historial" count={crud.lista.length} maxHeight="800px">
            {crud.lista.map(p => (
              <div key={p.id}
                className={`list-group-item p-3 border-bottom
                  ${crud.idEdicion === p.id ? 'bg-primary bg-opacity-10' : ''}`}
                style={crud.idEdicion === p.id
                  ? { borderLeft: '5px solid #003767' }
                  : { borderLeft: '5px solid transparent' }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="me-2 overflow-hidden">
                    <div className="d-flex align-items-center gap-1 mb-1">
                      <small className="fw-bold text-uppercase text-truncate"
                        style={{ color: '#d63384', fontSize: '0.7rem' }}>
                        {p.concurso || 'Sin concurso'}
                      </small>
                      {p.link_resolucion && (
                        <i title={p.link_resolucion.includes(BUCKET) ? 'PDF subido' : 'URL externa'}
                          className={`bi ${p.link_resolucion.includes(BUCKET)
                            ? 'bi-file-earmark-pdf-fill text-danger'
                            : 'bi-link-45deg text-primary'} small flex-shrink-0`}>
                        </i>
                      )}
                    </div>
                    <h6 className="mb-0 fw-bold text-dark text-truncate"
                      style={{ fontSize: '0.9rem' }} title={p.titulo}>
                      {p.titulo}
                    </h6>
                  </div>
                  <ListaAcciones
                    onEdit={() => handleEdit(p)}
                    onDelete={() => crud.handleDelete(p.id, '¿Eliminar este proyecto?')}
                  />
                </div>
              </div>
            ))}
            {crud.lista.length === 0 && <ListaVacia texto="No hay proyectos registrados." />}
          </SidebarCard>
        </div>
      </div>
    </>
  );
}