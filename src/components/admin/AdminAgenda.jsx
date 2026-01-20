import React, { useState, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

// Carga perezosa del editor
const Editor = lazy(() => import('react-simple-wysiwyg').then(module => ({ default: module.default || module })));

// --- HELPERS PARA FECHAS Y HORAS ---
const extractDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const extractTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const combineDateTime = (dateVal, timeVal) => {
  if (!dateVal || !timeVal) return null;
  return new Date(`${dateVal}T${timeVal}`).toISOString();
};

// --- COMPONENTE UPLOAD (Horizontal / Estilo Banner) ---
const UploadZone = ({ image, onUpload, onRemove, subiendo, required }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const zoneRef = useRef(null);

  useEffect(() => {
    const handlePaste = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) {
        return;
      }
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          onUpload(file);
          return;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onUpload]);


  return (
    <div className="d-flex flex-column mb-3">
      <label className="form-label fw-bold small text-secondary">
        Flyer / Portada (Horizontal) {required && <span className="text-danger">*</span>}
      </label>

      {/* Contenedor ajustado a formato horizontal amplio */}
      <div
        className={`position-relative rounded-3 overflow-hidden border transition-all ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-light border-secondary-subtle'}`}
        style={{
          width: '100%',
          aspectRatio: '21/9',
          maxHeight: '300px',
          borderStyle: image ? 'solid' : 'dashed',
          borderWidth: '2px',
          cursor: image ? 'default' : 'pointer',
          borderColor: isDragging ? '#0d6efd' : '#dee2e6'
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file?.type.startsWith('image/')) onUpload(file);
        }}
        onClick={() => !image && fileInputRef.current.click()}
      >
        <input type="file" hidden ref={fileInputRef} onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} accept="image/*" />

        {subiendo ? (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-primary">
            <div className="spinner-border spinner-border-sm mb-2"></div>
            <p className="small fw-bold mb-0">Subiendo...</p>
          </div>
        ) : image ? (
          <div className="w-100 h-100 position-relative group-hover">
            <img src={image} className="w-100 h-100 object-fit-cover bg-dark" alt="Flyer Preview" />
            <div className="position-absolute top-0 end-0 m-3">
              <button
                type="button"
                className="btn btn-danger shadow-sm rounded-3 border-0 d-flex align-items-center justify-content-center"
                style={{ width: '30px', height: '30px' }} // Tamaño cuadrado
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                title="Eliminar imagen"
              >
                {/* Usamos bi-trash (contorno) en lugar de bi-trash-fill para que coincida con tu imagen */}
                <i className="bi bi-trash" style={{ fontSize: '0.9rem' }}></i>
              </button>
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-3 text-center">
            <i className={`bi ${isDragging ? 'bi-cloud-upload-fill text-primary' : 'bi-card-image'} display-4 mb-2 opacity-50`}></i>
            <h6 className="fw-bold text-dark mb-1">Subir Imagen de Portada</h6>
            <p className="small mb-0 opacity-75">Arrastra o haz clic (Recomendado: 1280x600 px)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AdminAgenda() {
  const [listaEventos, setListaEventos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    hora_inicio: '',
    fecha_fin: '',
    hora_fin: '',
    tipo: '',
    lugar: '',
    link_externo: '',
    imagen_url: ''
  });

  useEffect(() => { fetchEventos(); }, []);

  // --- LOGICA SMARTLIST ---
  const sugerencias = useMemo(() => {
    const lugares = new Set();
    const tipos = new Set();

    listaEventos.forEach(e => {
      if (e.lugar) lugares.add(e.lugar);
      if (e.tipo) tipos.add(e.tipo);
    });

    if (tipos.size === 0) {
      ['Seminario', 'Workshop', 'Charla', 'Noticia'].forEach(t => tipos.add(t));
    }

    return {
      lugares: Array.from(lugares).sort(),
      tipos: Array.from(tipos).sort()
    };
  }, [listaEventos]);

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const fetchEventos = async () => {
    const { data } = await supabase.from('agenda').select('*').order('fecha_evento', { ascending: false });
    if (data) setListaEventos(data);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUploadImagen = async (file) => {
    setSubiendo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `agenda_${Date.now()}.${fileExt}`;
      const bucketName = 'agenda';
      const { error } = await supabase.storage.from(bucketName).upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, imagen_url: data.publicUrl }));
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'danger', texto: "Error al subir imagen" });
    } finally {
      setSubiendo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fecha_inicio || !formData.hora_inicio) {
      setMensaje({ tipo: 'danger', texto: 'Fecha y hora de inicio son obligatorias.' });
      return;
    }

    const fechaEventoISO = combineDateTime(formData.fecha_inicio, formData.hora_inicio);
    const fechaFinISO = combineDateTime(formData.fecha_fin, formData.hora_fin);

    const datosAEnviar = {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      tipo: formData.tipo || 'Evento',
      lugar: formData.lugar,
      link_externo: formData.link_externo,
      imagen_url: formData.imagen_url,
      fecha_evento: fechaEventoISO,
      fecha_fin: fechaFinISO
    };

    try {
      if (idEdicion) {
        await supabase.from('agenda').update(datosAEnviar).eq('id', idEdicion);
        setMensaje({ tipo: 'success', texto: '¡Evento actualizado correctamente!' });
      } else {
        await supabase.from('agenda').insert([datosAEnviar]);
        setMensaje({ tipo: 'success', texto: '¡Evento creado correctamente!' });
      }
      resetForm();
      fetchEventos();
    } catch (error) {
      setMensaje({ tipo: 'danger', texto: error.message });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este evento?')) {
      await supabase.from('agenda').delete().eq('id', id);
      fetchEventos();
    }
  };

  const cargarDatosParaEditar = (evento) => {
    setFormData({
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      tipo: evento.tipo,
      lugar: evento.lugar,
      link_externo: evento.link_externo,
      imagen_url: evento.imagen_url,
      fecha_inicio: extractDate(evento.fecha_evento),
      hora_inicio: extractTime(evento.fecha_evento),
      fecha_fin: extractDate(evento.fecha_fin),
      hora_fin: extractTime(evento.fecha_fin),
    });
    setIdEdicion(evento.id);
    document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      fecha_inicio: '', hora_inicio: '',
      fecha_fin: '', hora_fin: '',
      tipo: '',
      lugar: '',
      link_externo: '',
      imagen_url: ''
    });
    setIdEdicion(null);
  };

  return (
    <div>

      {/* --- ALERTA (Notificaciones) --- */}
      {mensaje && (
        <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show shadow-sm border-0 mb-4`}>
          <i className={`bi ${mensaje.tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          {mensaje.texto}
          <button className="btn-close" onClick={() => setMensaje(null)}></button>
        </div>
      )}<h2 className="mb-4 fw-bold" style={{ color: '#003767' }}>
        Gestión de Agenda
      </h2>
      <div className="row g-4">
        {/* --- COLUMNA IZQUIERDA: FORMULARIO --- */}
        <div className="col-lg-8">
          <form onSubmit={handleSubmit} className="card p-4 shadow-sm border-0 h-100" id="form-top">

            {/* Título del Formulario */}
            <h5 className="card-title mb-4 fw-bold text-dark border-bottom pb-2 d-flex align-items-center">
              <i className={`bi ${idEdicion ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: '#003767' }}></i>
              {idEdicion ? 'Editar Evento' : 'Nuevo Evento'}
            </h5>

            {/* 1. SECCIÓN IMAGEN (Usando el nuevo componente UploadZone) */}
            <div className="row mb-3">
              <div className="col-12">
                <UploadZone
                  image={formData.imagen_url}
                  onUpload={handleUploadImagen}
                  onRemove={() => setFormData(prev => ({ ...prev, imagen_url: '' }))}
                  subiendo={subiendo}
                  required
                />
              </div>
            </div>

            {/* 2. SECCIÓN DATOS PRINCIPALES */}
            <div className="row g-3">
              {/* Título del Evento */}
              <div className="col-12">
                <label className="form-label fw-bold small text-secondary">Título <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control fw-bold"
                  name="titulo"
                  required
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ej: Seminario de Inteligencia Artificial"
                />
              </div>

              {/* Fechas y Horas */}
              <div className="col-md-6">
                <div className="p-3 bg-light rounded border h-100">
                  {/* Inicio */}
                  <div className="row g-2 mb-2">
                    <div className="col-12 text-secondary fw-bold small"><i className="bi bi-play-circle me-1"></i> Inicio</div>
                    <div className="col-7">
                      <input type="date" className="form-control form-control-sm" name="fecha_inicio" required
                        value={formData.fecha_inicio} onChange={handleChange} />
                    </div>
                    <div className="col-5">
                      <input type="time" className="form-control form-control-sm" name="hora_inicio" required
                        value={formData.hora_inicio} onChange={handleChange} />
                    </div>
                  </div>
                  {/* Fin */}
                  <div className="row g-2">
                    <div className="col-12 text-secondary fw-bold small mt-1"><i className="bi bi-stop-circle me-1"></i> Fin (Opcional)</div>
                    <div className="col-7">
                      <input type="date" className="form-control form-control-sm" name="fecha_fin"
                        value={formData.fecha_fin} onChange={handleChange} />
                    </div>
                    <div className="col-5">
                      <input type="time" className="form-control form-control-sm" name="hora_fin"
                        value={formData.hora_fin} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tipo y Lugar */}
              <div className="col-md-6">
                <div className="row g-3 h-100 align-content-start">
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Tipo de Evento</label>
                    <input className="form-control" list="datalistTipos" name="tipo"
                      placeholder="Ej: Seminario, Taller..." value={formData.tipo} onChange={handleChange} />
                    <datalist id="datalistTipos">{sugerencias.tipos.map((t, i) => <option key={i} value={t} />)}</datalist>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Lugar / Ubicación</label>
                    <input className="form-control" list="datalistLugares" name="lugar"
                      placeholder="Ej: Auditorio Central" value={formData.lugar} onChange={handleChange} />
                    <datalist id="datalistLugares">{sugerencias.lugares.map((l, i) => <option key={i} value={l} />)}</datalist>
                  </div>
                </div>
              </div>

              {/* Descripción (Editor de Texto) */}
              <div className="col-12">
                <label className="form-label fw-bold small text-secondary">Descripción Detallada</label>
                <div className="border rounded bg-light overflow-hidden">
                  <Suspense fallback={<div className="p-3 text-center text-muted">Cargando editor...</div>}>
                    <Editor
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      containerProps={{ style: { minHeight: '150px' } }}
                    />
                  </Suspense>
                </div>
              </div>

              {/* Enlace Externo */}
              <div className="col-12 mb-2">
                <label className="form-label fw-bold small text-secondary">Enlace de Inscripción o Más Info (Opcional)</label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-secondary"><i className="bi bi-link-45deg"></i></span>
                  <input type="text" className="form-control" name="link_externo"
                    value={formData.link_externo} onChange={handleChange} placeholder="https://..." />
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="d-flex gap-2 mt-4 pt-3 border-top">
              <button type="submit" className="btn btn-primary fw-bold px-4 flex-grow-1" disabled={subiendo}>
                {subiendo ? <><span className="spinner-border spinner-border-sm me-2"></span>Subiendo...</> : (idEdicion ? 'Guardar Cambios' : 'Agendar Evento')}
              </button>
              {idEdicion && (
                <button type="button" className="btn btn-outline-secondary px-4" onClick={resetForm}>
                  Cancelar Edición
                </button>
              )}
            </div>
          </form>
        </div>

        {/* --- COLUMNA DERECHA: HISTORIAL (SIDEBAR) --- */}
        <div className="col-lg-4 d-flex flex-column">
          <div className="card shadow-sm border-0 bg-white h-100 d-flex flex-column" style={{ minHeight: '0' }}>
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="mb-0 fw-bold text-secondary">
                Historial ({listaEventos.length})
              </h6>
            </div>
            <div className="card-body p-0 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="list-group list-group-flush">
                {listaEventos.map(evento => (
                  <div key={evento.id}
                    className={`list-group-item d-flex gap-3 align-items-center p-3 transition-all ${idEdicion === evento.id ? 'bg-primary bg-opacity-10 border-primary' : ''}`}
                    style={idEdicion === evento.id ? { borderLeft: '4px solid #0d6efd' } : {}}
                  >
                    {/* Miniatura Imagen */}
                    <div style={{ width: '50px', height: '50px' }} className="rounded overflow-hidden bg-light flex-shrink-0 border d-flex align-items-center justify-content-center">
                      {evento.imagen_url ? (
                        <img src={evento.imagen_url} className="w-100 h-100 object-fit-cover" alt="" />
                      ) : <i className="bi bi-calendar text-muted"></i>}
                    </div>

                    {/* Texto Lista */}
                    <div className="flex-grow-1 overflow-hidden">
                      <h6 className="mb-0 fw-bold text-truncate text-dark small">{evento.titulo}</h6>
                      <div className="small text-muted">
                        {new Date(evento.fecha_evento).toLocaleDateString()}
                        <span className="ms-1 text-primary">
                          {new Date(evento.fecha_evento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Botones Lista */}
                    <div className="d-flex flex-column gap-1">
                      <button onClick={() => cargarDatosParaEditar(evento)} className="btn btn-sm btn-light text-primary py-0" title="Editar">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button onClick={() => handleDelete(evento.id)} className="btn btn-sm btn-light text-danger py-0" title="Eliminar">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
                {listaEventos.length === 0 && (
                  <div className="p-4 text-center text-muted small">
                    No hay eventos registrados aún.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}