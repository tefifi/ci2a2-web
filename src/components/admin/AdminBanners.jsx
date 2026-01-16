import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminGlobal.module.css';

const UploadZone = ({ image, onUpload, onRemove, subiendo, position, onPositionChange, required }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const dropRef = useRef(null);

    // Lógica de PEGAR (Ctrl+V) intacta
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    const blob = items[i].getAsFile();
                    onUpload(blob);
                }
            }
        };
        const currentDiv = dropRef.current;
        currentDiv?.addEventListener('paste', handlePaste);
        return () => currentDiv?.removeEventListener('paste', handlePaste);
    }, [onUpload]);

    const sliderValue = (position !== undefined && position !== null) ? parseInt(position) : 50;

    return (
        <div className="d-flex flex-column mb-4" ref={dropRef} tabIndex="0" style={{ outline: 'none' }}>
            <div className="d-flex justify-content-between align-items-end mb-2">
                <label className="form-label fw-bold small text-secondary mb-0">
                    Imagen del Banner {required && <span className="text-danger">*</span>}
                </label>
                <span className="badge bg-light text-secondary border fw-normal" style={{ fontSize: '0.75rem' }}>
                    <i className="bi bi-aspect-ratio me-1"></i> Recomendado: 1250 x 450 px
                </span>
            </div>

            <div
                // CAMBIO VISUAL: Colores azules (primary) en lugar de rosados
                className={`position-relative rounded-4 d-flex flex-column align-items-center justify-content-center text-center overflow-hidden border ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-white shadow-sm'}`}
                style={{
                    width: '100%',
                    aspectRatio: '25/9',
                    borderStyle: image ? 'solid' : 'dashed',
                    cursor: image ? 'default' : 'pointer',
                    borderColor: isDragging ? '#0d6efd' : '#dee2e6', // Azul institucional
                    transition: 'all 0.2s ease'
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault(); setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file?.type.startsWith('image/')) onUpload(file);
                }}
                onClick={() => !image && fileInputRef.current.click()}
            >
                <input type="file" hidden ref={fileInputRef} onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} accept="image/*" />

                {subiendo ? (
                    // CAMBIO VISUAL: Spinner azul
                    <div className="text-primary"><div className="spinner-border spinner-border-sm mb-2"></div><p className="small mb-0 fw-bold">Subiendo...</p></div>
                ) : image ? (
                    <div className="w-100 h-100 position-relative">
                        <img
                            src={image}
                            className="w-100 h-100 d-block"
                            style={{ objectFit: 'cover', objectPosition: `center ${sliderValue}%` }}
                            alt="Preview"
                        />
                        <div className="position-absolute top-0 end-0 m-3">
                            <button type="button" className="btn btn-danger btn-sm shadow-sm" onClick={(e) => { e.stopPropagation(); onRemove(); }}><i className="bi bi-trash"></i></button>
                        </div>
                    </div>
                ) : (
                    <div className="text-muted p-4">
                        {/* CAMBIO VISUAL: Icono coherente */}
                        <i className={`bi ${isDragging ? 'bi-cloud-upload-fill text-primary' : 'bi-cloud-arrow-up opacity-25'} fs-1 mb-2`}></i>
                        <p className="small fw-bold mb-0 text-dark">Arrastra o pega el banner aquí</p>
                        <p className="extra-small text-secondary mb-0">o haz click para buscar archivo</p>
                    </div>
                )}
            </div>

            {image && (
                <div className="mt-3 bg-white p-3 rounded-3 border shadow-sm">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold text-secondary small">Enfoque vertical: {sliderValue}%</span>
                        <i className="bi bi-arrows-expand text-muted"></i>
                    </div>
                    <input
                        type="range" className="form-range"
                        min="0" max="100" step="1"
                        value={sliderValue}
                        onChange={(e) => onPositionChange(parseInt(e.target.value))}
                    />
                </div>
            )}
        </div>
    );
};

export default function AdminBanners() {
    const [banners, setBanners] = useState([]);
    const [subiendo, setSubiendo] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    const [mensaje, setMensaje] = useState(null); // NUEVO: Estado para feedback

    const [formData, setFormData] = useState({
        title: '', link: '', active: true, order: 0, image_url: '', image_position: 50
    });

    useEffect(() => { fetchBanners(); }, []);

    // NUEVO: Limpieza automática del mensaje
    useEffect(() => {
        if (mensaje) {
            const timer = setTimeout(() => setMensaje(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    const fetchBanners = async () => {
        const { data, error } = await supabase.from('banners').select('*').order('order', { ascending: true });
        if (!error) setBanners(data);
    };

    const toggleVisibility = async (id, currentStatus) => {
        try {
            const { error } = await supabase.from('banners').update({ active: !currentStatus }).eq('id', id);
            if (error) throw error;
            fetchBanners();
        } catch (error) {
            setMensaje({ tipo: 'danger', texto: "Error al cambiar visibilidad: " + error.message });
        }
    };

    const handleDragEnd = async (resultBanners) => {
        setBanners(resultBanners);
        const updates = resultBanners.map((banner, index) =>
            supabase.from('banners').update({ order: index }).eq('id', banner.id)
        );
        try { await Promise.all(updates); } catch (error) { console.error("Error orden:", error); }
    };

    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('draggedIndex', index);
    };

    const handleOnDrop = (e, dropIndex) => {
        const dragIndex = e.dataTransfer.getData('draggedIndex');
        if (dragIndex === dropIndex) return;
        const newBanners = [...banners];
        const [draggedItem] = newBanners.splice(dragIndex, 1);
        newBanners.splice(dropIndex, 0, draggedItem);
        handleDragEnd(newBanners);
    };

    const handleUpload = async (file) => {
        const fileName = `${Date.now()}_banner.jpg`;
        try {
            setSubiendo(true);
            const { error: uploadError } = await supabase.storage.from('BANNERS').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('BANNERS').getPublicUrl(fileName);
            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error) { 
            setMensaje({ tipo: 'danger', texto: "Error al subir: " + error.message });
        } finally { setSubiendo(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.image_url) return setMensaje({ tipo: 'danger', texto: "Por favor sube una imagen primero" });

        try {
            if (idEdicion) {
                await supabase.from('banners').update(formData).eq('id', idEdicion);
                setMensaje({ tipo: 'success', texto: '¡Banner actualizado correctamente!' });
            } else {
                await supabase.from('banners').insert([{ ...formData, order: banners.length }]);
                setMensaje({ tipo: 'success', texto: '¡Banner creado con éxito!' });
            }
            setFormData({ title: '', link: '', active: true, order: 0, image_url: '', image_position: 50 });
            setIdEdicion(null);
            fetchBanners();
            // Scroll arriba para ver el mensaje
            document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) { 
            setMensaje({ tipo: 'danger', texto: "Error al guardar" });
        }
    };

    return (
        <div className="container py-4">
            <h2 className={`mb-4 ${styles.titulo}`}>Panel de Banners</h2>

            {/* NUEVO: Alerta de Feedback */}
            {mensaje && (
                <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show shadow-sm border-0`}>
                    <i className={`bi ${mensaje.tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    {mensaje.texto}
                    <button className="btn-close" onClick={() => setMensaje(null)}></button>
                </div>
            )}

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className={`card shadow-sm border-0 h-100 ${styles.contenedor}`} id="form-top">
                        <div className="card-body p-4">
                            
                            {/* CAMBIO VISUAL: Encabezado coherente con Noticias/Proyectos */}
                            <h5 className="card-title mb-4 fw-bold text-dark border-bottom pb-2">
                                <i className={`bi ${idEdicion ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: '#003767' }}></i>
                                {idEdicion ? 'Editar Banner' : 'Nuevo Banner'}
                            </h5>

                            <form onSubmit={handleSubmit}>
                                <UploadZone
                                    image={formData.image_url}
                                    position={formData.image_position}
                                    onPositionChange={(val) => setFormData({ ...formData, image_position: val })}
                                    onUpload={handleUpload}
                                    onRemove={() => setFormData({ ...formData, image_url: '', image_position: 50 })}
                                    subiendo={subiendo}
                                    required={true}
                                />

                                <div className="row g-3">
                                    <div className="col-md-7">
                                        <label className="small fw-bold text-secondary mb-1">Título del Banner</label>
                                        <input type="text" className="form-control" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ej: Evento Aniversario" required />
                                    </div>
                                    <div className="col-md-5">
                                        <label className="small fw-bold text-secondary mb-1">Enlace</label>
                                        <input type="url" className="form-control" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} placeholder="https://..." />
                                    </div>
                                    <div className="col-12 d-flex justify-content-between align-items-center mt-3">
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} id="activeSwitch" />
                                            <label className="form-check-label small fw-bold" htmlFor="activeSwitch">Publicar inmediatamente</label>
                                        </div>
                                        <div className="d-flex gap-2">
                                            {idEdicion && (
                                                <button type="button" className="btn btn-outline-secondary px-4 fw-bold" onClick={() => { setIdEdicion(null); setFormData({ title: '', link: '', active: true, order: 0, image_url: '', image_position: 50 }); }}>
                                                    Cancelar
                                                </button>
                                            )}
                                            {/* Botón azul UFRO */}
                                            <button type="submit" className="btn text-white fw-bold px-5" style={{ backgroundColor: '#003767' }} disabled={subiendo}>
                                                {idEdicion ? 'Actualizar Banner' : 'Guardar en Carrusel'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className={`card shadow-sm border-0 h-100 ${styles.contenedor}`}>
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-4 border-bottom pb-2">
                                <i className="bi bi-clock-history me-2 text-secondary"></i>
                                <h6 className="mb-0 fw-bold text-secondary">Historial (Arrastra para cambiar de posición)</h6>
                            </div>

                            <div className="vstack gap-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                {banners.length > 0 ? (
                                    banners.map((b, index) => (
                                        <div
                                            key={b.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleOnDrop(e, index)}
                                            // CAMBIO: Lógica de iluminado azul (border-primary) al editar
                                            className={`p-0 border rounded-3 bg-white transition-all ${idEdicion === b.id ? 'border-primary shadow' : 'shadow-sm'}`}
                                            style={{ cursor: 'grab', borderLeft: idEdicion === b.id ? '4px solid #0d6efd' : undefined }}
                                        >
                                            {/* INDICADOR DE ARRASTRE */}
                                            <div className="text-center bg-light border-bottom py-1" style={{ fontSize: '0.7rem', color: '#bbb' }}>
                                                <i className="bi bi-grip-horizontal"></i>
                                            </div>

                                            {/* VISTA PREVIA */}
                                            <div style={{ width: '100%', aspectRatio: '25/9', overflow: 'hidden', position: 'relative' }}>
                                                <img
                                                    src={b.image_url}
                                                    alt=""
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `center ${b.image_position}%` }}
                                                />
                                                <span className={`position-absolute top-0 start-0 m-2 badge ${b.active ? 'bg-success' : 'bg-secondary'}`}>
                                                    {b.active ? 'Activo' : 'Oculto'}
                                                </span>
                                            </div>

                                            {/* DATOS Y BOTONES */}
                                            <div className="p-3">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="overflow-hidden me-2" style={{ cursor: 'default' }}>
                                                        <h6 className={`mb-0 small fw-bold text-truncate ${idEdicion === b.id ? 'text-primary' : 'text-dark'}`}>{b.title || 'Sin título'}</h6>
                                                        <span className="extra-small text-muted">Posición: {index + 1}</span>
                                                    </div>

                                                    <div className="d-flex gap-1" onMouseDown={(e) => e.stopPropagation()}>
                                                        {/* CAMBIO VISUAL: Botones limpios e íconos estándar */}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); toggleVisibility(b.id, b.active); }}
                                                            className={`btn btn-sm btn-light border ${b.active ? 'text-success' : 'text-secondary'}`}
                                                            title="Visibilidad"
                                                        >
                                                            <i className={`bi ${b.active ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-light border text-primary"
                                                            onClick={(e) => { e.stopPropagation(); setFormData(b); setIdEdicion(b.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                            title="Editar"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-light border text-danger"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (confirm('¿Eliminar permanentemente este banner?')) {
                                                                    await supabase.from('banners').delete().eq('id', b.id);
                                                                    fetchBanners();
                                                                }
                                                            }}
                                                            title="Eliminar"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-5 opacity-50 small text-muted">
                                        <i className="bi bi-collection fs-2 mb-2 d-block"></i>
                                        No hay banners guardados
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