import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useMensaje } from './hooks/useMensaje';
import { AdminPageHeader, AdminAlert, FormHeader, ListaVacia } from './components/AdminUI';

// ─── UploadZone específica de Banners (mantiene el slider de posición) ────────
function BannerUpload({ image, position, onUpload, onRemove, onPositionChange, subiendo }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    const handlePaste = (e) => {
      for (const item of e.clipboardData.items) {
        if (item.type.startsWith('image/')) { onUpload(item.getAsFile()); return; }
      }
    };
    dropRef.current?.addEventListener('paste', handlePaste);
    return () => dropRef.current?.removeEventListener('paste', handlePaste);
  }, [onUpload]);

  const sliderVal = position !== undefined && position !== null ? parseInt(position) : 50;

  return (
    <div className="d-flex flex-column mb-4" ref={dropRef} tabIndex="0" style={{ outline: 'none' }}>
      <div className="d-flex justify-content-between align-items-end mb-2">
        <label className="form-label fw-bold small text-secondary mb-0">
          Imagen del Banner <span className="text-danger">*</span>
        </label>
        <span className="badge bg-light text-secondary border fw-normal" style={{ fontSize: '0.75rem' }}>
          <i className="bi bi-aspect-ratio me-1"></i>Recomendado: 1250×450 px
        </span>
      </div>

      <div
        className={`position-relative rounded-4 d-flex flex-column align-items-center justify-content-center text-center overflow-hidden border
          ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-white shadow-sm'}`}
        style={{
          width: '100%', aspectRatio: '25/9',
          borderStyle: image ? 'solid' : 'dashed',
          cursor: image ? 'default' : 'pointer',
          borderColor: isDragging ? '#0d6efd' : '#dee2e6',
          transition: 'all 0.2s ease',
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file?.type.startsWith('image/')) onUpload(file);
        }}
        onClick={() => !image && fileInputRef.current?.click()}
      >
        <input type="file" hidden ref={fileInputRef} accept="image/*"
          onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />

        {subiendo ? (
          <div className="text-primary">
            <div className="spinner-border spinner-border-sm mb-2"></div>
            <p className="small mb-0 fw-bold">Subiendo...</p>
          </div>
        ) : image ? (
          <div className="w-100 h-100 position-relative">
            <img src={image} className="w-100 h-100 d-block"
              style={{ objectFit: 'cover', objectPosition: `center ${sliderVal}%` }} alt="Preview" />
            <div className="position-absolute top-0 end-0 m-3">
              <button type="button" className="btn btn-danger btn-sm shadow-sm"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}>
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-muted p-4">
            <i className={`bi ${isDragging ? 'bi-cloud-upload-fill text-primary' : 'bi-cloud-arrow-up opacity-25'} fs-1 mb-2`}></i>
            <p className="small fw-bold mb-0 text-dark">Arrastra o pega el banner aquí</p>
            <p className="small text-secondary mb-0">o haz clic para buscar archivo</p>
          </div>
        )}
      </div>

      {image && (
        <div className="mt-3 bg-white p-3 rounded-3 border shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold text-secondary small">Enfoque vertical: {sliderVal}%</span>
            <i className="bi bi-arrows-expand text-muted"></i>
          </div>
          <input type="range" className="form-range" min="0" max="100" step="1"
            value={sliderVal} onChange={(e) => onPositionChange(parseInt(e.target.value))} />
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
const FORM_INICIAL = { title: '', link: '', active: true, order: 0, image_url: '', image_position: 50 };

export default function AdminBanners() {
  const [banners, setBanners]     = useState([]);
  const [subiendo, setSubiendo]   = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);
  const [form, setForm]           = useState(FORM_INICIAL);
  const { mensaje, mostrarMensaje, limpiarMensaje } = useMensaje();

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    const { data, error } = await supabase.from('banners').select('*').order('order', { ascending: true });
    if (!error) setBanners(data);
  };

  // ─── Subida de imagen ─────────────────────────────────────────────────────
  const handleUpload = async (file) => {
    setSubiendo(true);
    try {
      const fileName = `${Date.now()}_banner.jpg`;
      const { error } = await supabase.storage.from('BANNERS').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('BANNERS').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, image_url: data.publicUrl }));
    } catch (error) {
      mostrarMensaje('danger', 'Error al subir: ' + error.message);
    } finally {
      setSubiendo(false);
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image_url) { mostrarMensaje('danger', 'Por favor sube una imagen primero'); return; }
    try {
      if (idEdicion) {
        await supabase.from('banners').update(form).eq('id', idEdicion);
        mostrarMensaje('success', '¡Banner actualizado correctamente!');
      } else {
        await supabase.from('banners').insert([{ ...form, order: banners.length }]);
        mostrarMensaje('success', '¡Banner creado con éxito!');
      }
      setForm(FORM_INICIAL);
      setIdEdicion(null);
      fetchBanners();
    } catch {
      mostrarMensaje('danger', 'Error al guardar');
    }
  };

  // ─── Visibilidad ──────────────────────────────────────────────────────────
  const toggleVisibility = async (id, currentStatus) => {
    try {
      const { error } = await supabase.from('banners').update({ active: !currentStatus }).eq('id', id);
      if (error) throw error;
      fetchBanners();
    } catch (error) {
      mostrarMensaje('danger', 'Error al cambiar visibilidad: ' + error.message);
    }
  };

  // ─── Drag & Drop reordenamiento ───────────────────────────────────────────
  const handleDragStart = (e, index) => e.dataTransfer.setData('draggedIndex', index);

  const handleDrop = (e, dropIndex) => {
    const dragIndex = parseInt(e.dataTransfer.getData('draggedIndex'));
    if (dragIndex === dropIndex) return;
    const newBanners = [...banners];
    const [dragged] = newBanners.splice(dragIndex, 1);
    newBanners.splice(dropIndex, 0, dragged);
    setBanners(newBanners);
    Promise.all(newBanners.map((b, i) =>
      supabase.from('banners').update({ order: i }).eq('id', b.id)
    )).catch(console.error);
  };

  return (
    <div className="container py-4">
      <AdminPageHeader
        titulo="Gestión de Banners"
        mensaje={mensaje}
        onClose={limpiarMensaje}
      />

      <div className="row g-4">
        {/* ── FORMULARIO ── */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 h-100" id="form-top">
            <div className="card-body p-4">
              <FormHeader
                idEdicion={idEdicion}
                labelNuevo="Nuevo Banner"
                labelEditar="Editar Banner"
              />

              <form onSubmit={handleSubmit}>
                <BannerUpload
                  image={form.image_url}
                  position={form.image_position}
                  onUpload={handleUpload}
                  onRemove={() => setForm({ ...form, image_url: '', image_position: 50 })}
                  onPositionChange={(val) => setForm({ ...form, image_position: val })}
                  subiendo={subiendo}
                />

                <div className="row g-3">
                  <div className="col-md-7">
                    <label className="small fw-bold text-secondary mb-1">Título del Banner</label>
                    <input type="text" className="form-control" required
                      placeholder="Ej: Evento Aniversario"
                      value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="col-md-5">
                    <label className="small fw-bold text-secondary mb-1">Enlace</label>
                    <input type="url" className="form-control"
                      placeholder="https://..."
                      value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} />
                  </div>

                  <div className="col-12 d-flex justify-content-between align-items-center mt-3">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="activeSwitch"
                        checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                      <label className="form-check-label small fw-bold" htmlFor="activeSwitch">
                        Publicar inmediatamente
                      </label>
                    </div>
                    <div className="d-flex gap-2">
                      {idEdicion && (
                        <button type="button" className="btn btn-outline-secondary px-4 fw-bold"
                          onClick={() => { setIdEdicion(null); setForm(FORM_INICIAL); }}>
                          Cancelar
                        </button>
                      )}
                      <button type="submit" className="btn text-white fw-bold px-5"
                        style={{ backgroundColor: '#0d6efd' }} disabled={subiendo}>
                        {idEdicion ? 'Actualizar Banner' : 'Guardar en Carrusel'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ── LISTA LATERAL ── */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="mb-0 fw-bold text-secondary">Banners Actuales ({banners.length})</h6>
            </div>
            <div className="card-body p-0">
              <div className="vstack gap-3 p-3" style={{ maxHeight: 600, overflowY: 'auto' }}>
                {banners.map((b, index) => (
                  <div key={b.id} draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`p-0 border rounded-3 bg-white transition-all ${idEdicion === b.id ? 'border-primary shadow' : 'shadow-sm'}`}
                    style={{ cursor: 'grab', borderLeft: idEdicion === b.id ? '4px solid #0d6efd' : undefined }}
                  >
                    {/* Indicador drag */}
                    <div className="text-center bg-light border-bottom py-1" style={{ fontSize: '0.7rem', color: '#bbb' }}>
                      <i className="bi bi-grip-horizontal"></i>
                    </div>

                    {/* Preview imagen */}
                    <div style={{ width: '100%', aspectRatio: '25/9', overflow: 'hidden', position: 'relative' }}>
                      <img src={b.image_url} alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `center ${b.image_position}%` }} />
                      <span className={`position-absolute top-0 start-0 m-2 badge ${b.active ? 'bg-success' : 'bg-secondary'}`}>
                        {b.active ? 'Activo' : 'Oculto'}
                      </span>
                    </div>

                    {/* Datos y botones */}
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="overflow-hidden me-2">
                          <h6 className={`mb-0 small fw-bold text-truncate ${idEdicion === b.id ? 'text-primary' : 'text-dark'}`}>
                            {b.title || 'Sin título'}
                          </h6>
                          <span className="small text-muted">Posición: {index + 1}</span>
                        </div>

                        <div className="d-flex gap-1" onMouseDown={(e) => e.stopPropagation()}>
                          <button type="button"
                            className={`btn btn-sm btn-light border ${b.active ? 'text-success' : 'text-secondary'}`}
                            onClick={(e) => { e.stopPropagation(); toggleVisibility(b.id, b.active); }}
                            title="Visibilidad">
                            <i className={`bi ${b.active ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
                          </button>
                          <button type="button" className="btn btn-sm btn-light border text-primary"
                            onClick={(e) => { e.stopPropagation(); setForm(b); setIdEdicion(b.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            title="Editar">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button type="button" className="btn btn-sm btn-light border text-danger"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('¿Eliminar permanentemente este banner?')) {
                                await supabase.from('banners').delete().eq('id', b.id);
                                fetchBanners();
                              }
                            }}
                            title="Eliminar">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {banners.length === 0 && <ListaVacia texto="No hay banners guardados." />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}