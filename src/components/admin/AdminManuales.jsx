import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

const BUCKET = 'manuales';

// ─── Formatear tamaño en KB/MB ────────────────────────────────────────────────
const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Formatear fecha ──────────────────────────────────────────────────────────
const formatFecha = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export default function AdminManuales() {
  const [manuales, setManuales]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [subiendo, setSubiendo]   = useState(false);
  const [progreso, setProgreso]   = useState(0);
  const [mensaje, setMensaje]     = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null); // URL del PDF en vista previa
  const [confirmando, setConfirmando] = useState(null); // nombre del archivo a eliminar
  const [nombre, setNombre]       = useState('');
  const [version, setVersion]     = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo]     = useState(null);
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => { fetchManuales(); }, []);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  };

  // ── Cargar lista desde Supabase Storage ──────────────────────────────────────
  const fetchManuales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) throw error;

      // Filtrar carpetas y archivos vacíos
      const archivos = (data || []).filter(f => f.name && f.name !== '.emptyFolderPlaceholder');

      // Enriquecer con URLs públicas
      const conUrls = archivos.map(f => ({
        ...f,
        publicUrl: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
      }));
      setManuales(conUrls);
    } catch (err) {
      mostrarMensaje('danger', 'Error al cargar manuales: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Subir manual ─────────────────────────────────────────────────────────────
  const handleSubir = async (e) => {
    e.preventDefault();
    if (!archivo) { mostrarMensaje('danger', 'Selecciona un archivo PDF.'); return; }
    if (!nombre.trim()) { mostrarMensaje('danger', 'Ingresa un nombre para el manual.'); return; }

    setSubiendo(true);
    setProgreso(10);

    try {
      // Nombre del archivo: version_nombre-limpio_timestamp.pdf
      const nombreLimpio = nombre.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
      const versionStr   = version.trim() ? `v${version.trim().replace(/\s+/g, '')}_` : '';
      const timestamp    = Date.now();
      const nombreArchivo = `${versionStr}${nombreLimpio}_${timestamp}.pdf`;

      setProgreso(30);

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(nombreArchivo, archivo, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (error) throw error;

      setProgreso(100);
      mostrarMensaje('success', `✓ Manual "${nombre}" subido correctamente.`);
      setNombre(''); setVersion(''); setDescripcion(''); setArchivo(null);
      if (inputRef.current) inputRef.current.value = '';
      await fetchManuales();
    } catch (err) {
      mostrarMensaje('danger', 'Error al subir: ' + err.message);
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────────
  const handleEliminar = async (nombreArchivo) => {
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([nombreArchivo]);
      if (error) throw error;
      mostrarMensaje('success', 'Manual eliminado.');
      setConfirmando(null);
      if (vistaPrevia?.includes(nombreArchivo)) setVistaPrevia(null);
      await fetchManuales();
    } catch (err) {
      mostrarMensaje('danger', 'Error al eliminar: ' + err.message);
    }
  };

  // ── Descargar ─────────────────────────────────────────────────────────────────
  const handleDescargar = async (nombreArchivo, urlPublica) => {
    try {
      const a = document.createElement('a');
      a.href = urlPublica;
      a.download = nombreArchivo;
      a.target = '_blank';
      a.click();
    } catch (err) {
      mostrarMensaje('danger', 'Error al descargar.');
    }
  };

  // ── Parsear nombre legible desde el nombre de archivo ─────────────────────────
  const parsearNombre = (nombreArchivo) => {
    // Formato: v1.0_NombreManual_timestamp.pdf
    const sinExt   = nombreArchivo.replace('.pdf', '');
    const partes   = sinExt.split('_');
    const version  = partes[0]?.startsWith('v') ? partes[0] : null;
    const sinTs    = partes.slice(0, -1); // quitar timestamp
    const sinVer   = version ? sinTs.slice(1) : sinTs;
    const nombre   = sinVer.join(' ').replace(/_/g, ' ');
    return { nombre: nombre || nombreArchivo, version };
  };

  return (
    <div className="container-fluid p-0">

      {/* ── Mensaje ── */}
      {mensaje && (
        <div className={`alert alert-${mensaje.tipo} border-0 shadow-sm mb-4 d-flex align-items-center`}>
          <i className={`bi ${mensaje.tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2 fs-5`}></i>
          <span className="fw-medium flex-grow-1">{mensaje.texto}</span>
          <button className="btn-close" onClick={() => setMensaje(null)}></button>
        </div>
      )}

      <div className="row g-4">

        {/* ── FORMULARIO SUBIDA ── */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white border-bottom py-3 px-4" style={{ borderRadius: '16px 16px 0 0' }}>
              <h5 className="mb-0 fw-bold" style={{ color: '#003767' }}>
                <i className="bi bi-cloud-arrow-up me-2"></i>Subir Manual
              </h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubir}>

                {/* Drop zone PDF */}
                <div
                  className={`rounded-3 border d-flex flex-column align-items-center justify-content-center p-4 text-center mb-3 ${isDragging ? 'border-primary bg-primary bg-opacity-10' : archivo ? 'border-success bg-success bg-opacity-10' : 'bg-light'}`}
                  style={{ borderStyle: 'dashed', minHeight: '120px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault(); setIsDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f?.type === 'application/pdf') setArchivo(f);
                    else mostrarMensaje('danger', 'Solo se aceptan archivos PDF.');
                  }}
                  onClick={() => inputRef.current?.click()}
                >
                  {archivo ? (
                    <>
                      <i className="bi bi-file-earmark-pdf-fill text-success fs-2 mb-2"></i>
                      <p className="mb-0 fw-bold small text-success text-truncate w-100 px-2">{archivo.name}</p>
                      <small className="text-muted">{formatSize(archivo.size)}</small>
                    </>
                  ) : (
                    <>
                      <i className={`bi bi-file-earmark-arrow-up fs-2 mb-2 ${isDragging ? 'text-primary' : 'text-muted opacity-50'}`}></i>
                      <p className="mb-0 fw-bold small text-muted">Arrastra el PDF aquí</p>
                      <small className="text-muted opacity-75">o haz clic para buscar</small>
                    </>
                  )}
                  <input type="file" ref={inputRef} className="d-none" accept="application/pdf"
                    onChange={(e) => e.target.files[0] && setArchivo(e.target.files[0])} />
                </div>

                {/* Nombre */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">
                    Nombre del Manual <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control bg-light border-0"
                    placeholder="Ej: Manual de Usuario CI2A2"
                    value={nombre} onChange={e => setNombre(e.target.value)} required />
                </div>

                {/* Versión */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Versión</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0 text-secondary small fw-bold">v</span>
                    <input type="text" className="form-control bg-light border-0"
                      placeholder="1.0"
                      value={version} onChange={e => setVersion(e.target.value)} />
                  </div>
                </div>

                {/* Descripción */}
                <div className="mb-4">
                  <label className="form-label small fw-bold text-secondary">Descripción (opcional)</label>
                  <textarea className="form-control bg-light border-0" rows="2"
                    placeholder="Ej: Manual completo para usuarios del portal..."
                    value={descripcion} onChange={e => setDescripcion(e.target.value)} />
                </div>

                {/* Barra de progreso */}
                {subiendo && (
                  <div className="mb-3">
                    <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
                      <div className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                        style={{ width: `${progreso}%`, transition: 'width 0.3s' }}></div>
                    </div>
                    <small className="text-muted mt-1 d-block text-center">Subiendo...</small>
                  </div>
                )}

                <button type="submit" className="btn w-100 fw-bold text-white py-2"
                  style={{ background: '#003767', borderRadius: '10px' }}
                  disabled={subiendo || !archivo}>
                  {subiendo
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Subiendo...</>
                    : <><i className="bi bi-cloud-arrow-up me-2"></i>Publicar Manual</>
                  }
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── LISTA DE MANUALES ── */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center" style={{ borderRadius: '16px 16px 0 0' }}>
              <h5 className="mb-0 fw-bold" style={{ color: '#003767' }}>
                <i className="bi bi-folder2-open me-2"></i>
                Manuales Disponibles
                <span className="badge bg-light text-secondary border ms-2 fw-normal" style={{ fontSize: '0.8rem' }}>
                  {manuales.length}
                </span>
              </h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchManuales} disabled={loading}>
                <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
              </button>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border spinner-border-sm mb-2"></div>
                  <p className="small mb-0">Cargando manuales...</p>
                </div>
              ) : manuales.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-folder2 fs-1 d-block mb-2 opacity-25"></i>
                  <p className="small mb-0">No hay manuales subidos aún.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {manuales.map((manual) => {
                    const { nombre: nombreLegible, version: ver } = parsearNombre(manual.name);
                    const esActivo = vistaPrevia === manual.publicUrl;
                    return (
                      <div key={manual.name}
                        className={`list-group-item p-3 ${esActivo ? 'bg-primary bg-opacity-10' : ''}`}
                        style={{ borderLeft: esActivo ? '4px solid #003767' : '4px solid transparent' }}>
                        <div className="d-flex align-items-center gap-3">

                          {/* Icono PDF */}
                          <div className="flex-shrink-0 rounded-3 d-flex align-items-center justify-content-center"
                            style={{ width: 48, height: 48, background: '#fff0f0' }}>
                            <i className="bi bi-file-earmark-pdf-fill text-danger fs-4"></i>
                          </div>

                          {/* Info */}
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <h6 className={`mb-0 fw-bold text-truncate ${esActivo ? 'text-primary' : 'text-dark'}`}
                                style={{ fontSize: '0.95rem' }} title={nombreLegible}>
                                {nombreLegible}
                              </h6>
                              {ver && (
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-bold flex-shrink-0"
                                  style={{ fontSize: '0.7rem' }}>{ver}</span>
                              )}
                            </div>
                            <div className="d-flex gap-3">
                              <small className="text-muted">
                                <i className="bi bi-calendar3 me-1"></i>
                                {formatFecha(manual.created_at)}
                              </small>
                              <small className="text-muted">
                                <i className="bi bi-hdd me-1"></i>
                                {formatSize(manual.metadata?.size)}
                              </small>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="d-flex gap-1 flex-shrink-0">
                            {/* Ver */}
                            <button
                              className={`btn btn-sm ${esActivo ? 'btn-primary' : 'btn-light border'}`}
                              title="Vista previa"
                              onClick={() => setVistaPrevia(esActivo ? null : manual.publicUrl)}
                            >
                              <i className={`bi ${esActivo ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                            </button>
                            {/* Descargar */}
                            <button className="btn btn-sm btn-light border text-success"
                              title="Descargar"
                              onClick={() => handleDescargar(manual.name, manual.publicUrl)}>
                              <i className="bi bi-download"></i>
                            </button>
                            {/* Eliminar */}
                            <button className="btn btn-sm btn-light border text-danger"
                              title="Eliminar"
                              onClick={() => setConfirmando(manual.name)}>
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>
                        </div>

                        {/* Vista previa inline */}
                        {esActivo && (
                          <div className="mt-3 rounded-3 overflow-hidden border" style={{ height: '500px' }}>
                            <iframe
                              src={`${manual.publicUrl}#toolbar=1&navpanes=0`}
                              className="w-100 h-100"
                              title={nombreLegible}
                              style={{ border: 'none' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL CONFIRMAR ELIMINACIÓN ── */}
      {confirmando && (
        <>
          <div onClick={() => setConfirmando(null)} style={{
            position: 'fixed', inset: 0, zIndex: 1055,
            backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
          }} />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1056,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}>
            <div style={{
              background: '#fff', borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              maxWidth: '400px', width: '100%', overflow: 'hidden',
            }}>
              <div style={{ height: '5px', background: 'linear-gradient(90deg, #dc3545, #e85d6a)' }} />
              <div style={{ padding: '2rem' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: '#fff0f0', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: '1rem',
                }}>
                  <i className="bi bi-trash3-fill" style={{ fontSize: '1.4rem', color: '#dc3545' }}></i>
                </div>
                <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>¿Eliminar este manual?</h5>
                <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  <strong>{parsearNombre(confirmando).nombre}</strong> se eliminará permanentemente.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => setConfirmando(null)} style={{
                    flex: 1, padding: '0.6rem', borderRadius: '8px',
                    border: '1.5px solid #dee2e6', background: '#fff',
                    fontWeight: 600, cursor: 'pointer',
                  }}>Cancelar</button>
                  <button onClick={() => handleEliminar(confirmando)} style={{
                    flex: 1, padding: '0.6rem', borderRadius: '8px',
                    border: 'none', background: 'linear-gradient(135deg, #dc3545, #c82333)',
                    fontWeight: 600, color: '#fff', cursor: 'pointer',
                  }}>
                    <i className="bi bi-trash3 me-2"></i>Sí, eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}