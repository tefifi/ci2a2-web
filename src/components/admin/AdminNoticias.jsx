import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminGlobal.module.css';

const Editor = lazy(() => import('react-simple-wysiwyg').then(module => ({ default: module.default || module })));

const UploadZone = ({ image, onUpload, onRemove, subiendo, required }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const handlePaste = (e) => {
            const item = e.clipboardData.items[0];
            if (item?.type.startsWith('image/')) {
                const file = item.getAsFile();
                onUpload(file);
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [onUpload]);

    return (
        <div className="h-100 d-flex flex-column">
            <label className="form-label fw-bold small text-secondary">
                Imagen Portada {required && <span className="text-danger">*</span>}
            </label>

            <div
                className={`flex-grow-1 position-relative rounded-3 d-flex flex-column align-items-center justify-content-center text-center transition-all overflow-hidden border ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
                style={{
                    width: '100%',
                    aspectRatio: '2/1',
                    borderStyle: image ? 'solid' : 'dashed',
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
                    <div className="text-primary"><div className="spinner-border spinner-border-sm mb-2"></div><p className="small mb-0 fw-bold">Procesando...</p></div>
                ) : image ? (
                    <div className="w-100 h-100 position-relative">
                        <img src={image} className="w-100 h-100 object-fit-cover" alt="Previsualización" />
                        <div className="position-absolute top-0 end-0 m-2">
                            <button type="button" className="btn btn-danger btn-sm shadow" onClick={(e) => { e.stopPropagation(); onRemove(); }}><i className="bi bi-trash"></i></button>
                        </div>
                    </div>
                ) : (
                    <div className="text-muted pe-none p-3">
                        <i className="bi bi-card-image display-4 mb-2 opacity-50"></i>
                        <p className="small fw-bold mb-0 text-dark">Arrastrar, Click o Pegar imagen</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function AdminNoticias() {
    const [listaNoticias, setListaNoticias] = useState([]);
    const [formData, setFormData] = useState({ titulo: '', bajada: '', cuerpo: '', fecha: '', image_url: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [subiendo, setSubiendo] = useState(false);
    const [mensaje, setMensaje] = useState(null); // Feedback message state

    useEffect(() => { fetchNoticias(); }, []);

    // Clear feedback message automatically
    useEffect(() => {
        if (mensaje) {
            const timer = setTimeout(() => setMensaje(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    const fetchNoticias = async () => {
        const { data } = await supabase.from('noticias').select('*').order('fecha', { ascending: false });
        if (data) setListaNoticias(data);
    };

    const handleUpload = async (file) => {
        setSubiendo(true);
        try {
            const fileName = `${Date.now()}_${file.name}`;
            const { error } = await supabase.storage.from('noticias-img').upload(fileName, file);
            if (error) throw error;
            const { data } = supabase.storage.from('noticias-img').getPublicUrl(fileName);
            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (e) { setMensaje({ tipo: 'danger', texto: "Error al subir imagen" }); } finally { setSubiendo(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await supabase.from('noticias').update(formData).eq('id', isEditing);
                setMensaje({ tipo: 'success', texto: '¡Noticia actualizada correctamente!' });
            } else {
                await supabase.from('noticias').insert([formData]);
                setMensaje({ tipo: 'success', texto: '¡Noticia creada correctamente!' });
            }
            resetForm();
            fetchNoticias();
            // Scroll to top to see message
            document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            setMensaje({ tipo: 'danger', texto: "Error al guardar la noticia" });
        }
    };

    const resetForm = () => {
        setFormData({ titulo: '', bajada: '', cuerpo: '', fecha: '', image_url: '' });
        setIsEditing(false);
    };

    const cargarEdicion = (item) => {
        setFormData(item);
        setIsEditing(item.id);
        document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar esta noticia?")) return;
        await supabase.from('noticias').delete().eq('id', id);
        fetchNoticias();
    };

    return (
        <div className={styles.contenedor}>
            <h2 className={`mb-4 ${styles.titulo}`}>Gestión de Noticias</h2>

            {/* Feedback Message */}
            {mensaje && (
                <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show shadow-sm border-0`}>
                    <i className={`bi ${mensaje.tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    {mensaje.texto}
                    <button className="btn-close" onClick={() => setMensaje(null)}></button>
                </div>
            )}

            <div className="row g-4">
                <div className="col-lg-8">
                    <form onSubmit={handleSubmit} className="card p-3 shadow-sm border-0 h-100" id="form-top">
                        {/* Nuevo Encabezado Agregado */}
                        <h5 className="card-title mb-4 fw-bold text-dark border-bottom pb-2">
                            <i className={`bi ${isEditing ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: '#003767' }}></i>
                            {isEditing ? 'Editar' : 'Nueva'} Noticia
                        </h5>

                        <div className="mb-3">
                            <UploadZone
                                image={formData.image_url}
                                onUpload={handleUpload}
                                onRemove={() => setFormData({ ...formData, image_url: '' })}
                                subiendo={subiendo}
                                required
                            />
                        </div>
                        
                        <div className="mb-2">
                            <label className="form-label fw-bold small text-secondary">Título <span className="text-danger">*</span></label>
                            <input className="form-control fw-small" placeholder="Ingrese título de la noticia" value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} required />
                        </div>

                        <div className="mb-2">
                            <label className="form-label fw-bold small text-secondary">Bajada o Resumen (Máx. 300 caracteres)</label>
                            <textarea className="form-control small" placeholder="Escriba un breve resumen..." rows="2" maxLength="300" value={formData.bajada} onChange={e => setFormData({ ...formData, bajada: e.target.value })} />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold small text-secondary">Fecha de Publicación <span className="text-danger">*</span></label>
                            <input type="date" className="form-control" value={formData.fecha} onChange={e => setFormData({ ...formData, fecha: e.target.value })} required />
                        </div>

                        <label className="form-label fw-bold small text-secondary">Cuerpo de la Noticia <span className="text-danger">*</span></label>
                        <div className="flex-grow-1 border rounded bg-light mb-3">
                            <Suspense fallback="Cargando editor...">
                                <Editor value={formData.cuerpo} onChange={e => setFormData({ ...formData, cuerpo: e.target.value })} containerProps={{ style: { minHeight: '200px' } }} />
                            </Suspense>
                        </div>

                        <div className="d-flex gap-2">
                            <button type="submit" className="btn w-100 fw-bold btn-primary" style={isEditing ? {backgroundColor: '#0056b3'} : {}}>
                                {isEditing ? 'Guardar Cambios' : 'Publicar Noticia'}
                            </button>
                            {isEditing && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancelar</button>}
                        </div>
                    </form>
                </div>

                {/* COLUMNA DERECHA: HISTORIAL */}
                <div className="col-lg-4 d-flex flex-column">
                    <div className="card shadow-sm border-0 bg-white h-100 d-flex flex-column" style={{ minHeight: '0' }}>
                        
                        {/* --- HEADER UNIFICADO --- */}
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 fw-bold text-secondary">Historial ({listaNoticias.length})</h6>
                        </div>

                        {/* --- CUERPO CON SCROLL --- */}
                        <div className="card-body p-0 overflow-auto" style={{ maxHeight: '600px' }}>
                            <div className="list-group list-group-flush shadow-sm">
                                {listaNoticias.map(n => (
                                    <div 
                                        key={n.id} 
                                        // Lógica de iluminado azul
                                        className={`list-group-item d-flex gap-3 align-items-center p-3 transition-all ${isEditing === n.id ? 'bg-primary bg-opacity-10 border-primary' : ''}`}
                                        style={isEditing === n.id ? {borderLeft: '4px solid #0d6efd'} : {}}
                                    >
                                        {/* Imagen miniatura */}
                                        <div style={{ width: '80px', height: '50px' }} className="rounded overflow-hidden bg-light flex-shrink-0">
                                            {n.image_url ? <img src={n.image_url} className="w-100 h-100 object-fit-cover" alt="" /> : null}
                                        </div>

                                        {/* Textos */}
                                        <div className="flex-grow-1">
                                            <h6 className={`mb-0 fw-bold ${isEditing === n.id ? 'text-primary' : ''}`}>{n.titulo}</h6>
                                            <small className="text-muted">{n.fecha}</small>
                                        </div>

                                        {/* Botones Unificados */}
                                        <div>
                                            <button 
                                                onClick={() => cargarEdicion(n)} 
                                                className="btn btn-sm btn-light text-primary me-1" 
                                                title="Editar"
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(n.id)} 
                                                className="btn btn-sm btn-light text-danger" 
                                                title="Eliminar"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {listaNoticias.length === 0 && (
                                    <div className="text-center p-5 text-muted small">No hay noticias registradas.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}