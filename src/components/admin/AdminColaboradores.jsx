import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminGlobal.module.css';

// --- COMPONENTE AVATAR (Sin cambios) ---
const AvatarUpload = ({ image, onUpload, onRemove, subiendo }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const handlePaste = (e) => {
            if (e.clipboardData.items.length > 0) {
                const item = e.clipboardData.items[0];
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    onUpload(file);
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [onUpload]);

    return (
        <div className="d-flex flex-column align-items-center justify-content-center h-100">
            <div
                className={`position-relative rounded-circle shadow-sm d-flex align-items-center justify-content-center transition-all overflow-hidden border border-2 
                ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-white'}`}
                style={{
                    width: '160px',
                    height: '160px',
                    cursor: image ? 'default' : 'pointer',
                    borderColor: isDragging ? '#0d6efd' : '#f0f0f0'
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) onUpload(file);
                }}
                onClick={() => !image && fileInputRef.current.click()}
            >
                {subiendo ? (
                    <div className="spinner-border text-primary" role="status"></div>
                ) : image ? (
                    <img src={image} className="w-100 h-100 object-fit-cover" alt="Perfil" />
                ) : (
                    <div className={`text-center transition-all ${isDragging ? 'text-primary' : 'text-secondary opacity-50'}`}>
                        <i className={`bi ${isDragging ? 'bi-cloud-upload-fill' : 'bi-camera-fill'} display-4`}></i>
                        <div className="small fw-bold mt-1">
                            {isDragging ? 'SOLTAR' : 'SUBIR FOTO'}
                        </div>
                    </div>
                )}

                <input type="file" hidden ref={fileInputRef} onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} accept="image/*" />
            </div>

            <div className="mt-3 text-center">
                {image ? (
                    <button type="button" className="btn btn-link text-danger text-decoration-none btn-sm fw-bold p-0" onClick={onRemove}>
                        <i className="bi bi-trash me-1"></i>Eliminar foto
                    </button>
                ) : (
                    <span className="text-muted small fst-italic" style={{ fontSize: '0.8rem' }}>
                        Arrastra, pega o haz clic
                    </span>
                )}
            </div>
        </div>
    );
};

export default function AdminColaboradores() {
    const [listaColaboradores, setListaColaboradores] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const [subiendo, setSubiendo] = useState(false);

    const [idEdicion, setIdEdicion] = useState(null);

    // 1. CAMBIO AQUÍ: Agregamos 'profesion' al estado inicial
    const [formData, setFormData] = useState({
        nombre: '',
        cargo: '',
        profesion: '', // <--- NUEVO CAMPO
        facultad: '',
        email: '',
        bio: '',
        foto_url: '',
        linkedin: ''
    });

    useEffect(() => { fetchColaboradores(); }, []);

    useEffect(() => {
        if (mensaje) {
            const timer = setTimeout(() => setMensaje(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    const fetchColaboradores = async () => {
        try {
            const { data } = await supabase.from('colaboradores').select('*').order('id', { ascending: true });
            if (data) setListaColaboradores(data);
        } catch (error) { console.error(error); }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleUpload = async (file) => {
        try {
            setSubiendo(true);
            const url = await uploadImage(file);
            setFormData(prev => ({ ...prev, foto_url: url }));
        } catch (error) {
            setMensaje({ tipo: 'danger', texto: error.message });
        } finally {
            setSubiendo(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // El formData ya incluye 'profesion', se enviará automáticamente
        const datosEnvio = { ...formData, linkedin: formData.linkedin || null, email: formData.email || null };
        try {
            if (idEdicion) {
                const { error } = await supabase.from('colaboradores').update(datosEnvio).eq('id', idEdicion);
                if (error) throw error;
                setMensaje({ tipo: 'success', texto: '¡Colaborador actualizado correctamente!' });
            } else {
                const { error } = await supabase.from('colaboradores').insert([datosEnvio]);
                if (error) throw error;
                setMensaje({ tipo: 'success', texto: '¡Colaborador añadido con éxito!' });
            }
            // Limpiar form
            setFormData({ nombre: '', cargo: '', profesion: '', facultad: '', email: '', bio: '', foto_url: '', linkedin: '' });
            setIdEdicion(null);
            fetchColaboradores();
            document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            setMensaje({ tipo: 'danger', texto: error.message });
        }
    };

    const cargarDatosParaEditar = (c) => {
        // 2. CAMBIO AQUÍ: Recuperamos la profesión al editar
        setFormData({
            ...c,
            profesion: c.profesion || '',
            email: c.email || '',
            linkedin: c.linkedin || ''
        });
        setIdEdicion(c.id);
        document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (confirm('¿Eliminar colaborador?')) {
            await supabase.from('colaboradores').delete().eq('id', id);
            fetchColaboradores();
        }
    };

    const uploadImage = async (file) => {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage.from('fotos').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('fotos').getPublicUrl(filePath);
        return data.publicUrl;
    };

    return (
        <div className="container py-4">
            <h2 className={`mb-4 ${styles.titulo}`}>Gestión de Colaboradores</h2>

            {mensaje && (
                <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show shadow-sm border-0`}>
                    <i className={`bi ${mensaje.tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    {mensaje.texto}
                    <button className="btn-close" onClick={() => setMensaje(null)}></button>
                </div>
            )}

            <div className="row g-4 align-items-stretch">
                {/* --- FORMULARIO (IZQUIERDA) --- */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 bg-white h-100" id="form-top">
                        <div className="card-body p-4">

                            <h5 className="card-title mb-4 fw-bold text-dark border-bottom pb-2">
                                <i className={`bi ${idEdicion ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: '#003767' }}></i>
                                {idEdicion ? 'Editar Integrante' : 'Nuevo Integrante'}
                            </h5>

                            <form onSubmit={handleSubmit}>
                                <div className="row g-4">
                                    <div className="col-md-4">
                                        <AvatarUpload
                                            image={formData.foto_url}
                                            onUpload={handleUpload}
                                            onRemove={() => setFormData(prev => ({ ...prev, foto_url: '' }))}
                                            subiendo={subiendo}
                                        />
                                    </div>
                                    <div className="col-md-8">
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label small fw-bold text-secondary">Nombre Completo <span className="text-danger">*</span></label>
                                                <input type="text" className="form-control" name="nombre" required value={formData.nombre} onChange={handleChange} placeholder="Ej. Dra. Ana Pérez" />
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label small fw-bold text-secondary">Cargo / Rol <span className="text-danger">*</span></label>
                                                <input type="text" className="form-control" name="cargo" required value={formData.cargo} onChange={handleChange} placeholder="Ej. Investigadora Principal" />
                                            </div>

                                            {/* 3. CAMBIO AQUÍ: Nuevo Input para Carrera/Profesión */}
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">Carrera / Profesión</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="profesion"
                                                    value={formData.profesion}
                                                    onChange={handleChange}
                                                    placeholder="Ej. Ing. Civil Informática"
                                                />
                                                <div className="form-text" style={{ fontSize: '0.7rem' }}>Dato clave para los gráficos.</div>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">Facultad</label>
                                                <input type="text" className="form-control" name="facultad" value={formData.facultad} onChange={handleChange} placeholder="Ej. Fac. de Ingeniería" />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">Email</label>
                                                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} placeholder="correo@institucion.cl" />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">LinkedIn (URL)</label>
                                                <input type="url" className="form-control" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-bold text-secondary">Breve Biografía</label>
                                                <textarea className="form-control" name="bio" rows="3" value={formData.bio} onChange={handleChange} placeholder="Descripción corta del perfil profesional..."></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 d-flex gap-2 justify-content-end border-top pt-3">
                                    <button
                                        type="submit"
                                        className="btn px-4 fw-bold text-white shadow-sm"
                                        style={{ backgroundColor: idEdicion ? '#0056b3' : '#0d6efd' }}
                                        disabled={subiendo}
                                    >
                                        {idEdicion ? 'Guardar Cambios' : 'Añadir al Equipo'}
                                    </button>

                                    {idEdicion && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary px-4"
                                            onClick={() => {
                                                setIdEdicion(null);
                                                setFormData({ nombre: '', cargo: '', profesion: '', facultad: '', email: '', bio: '', foto_url: '', linkedin: '' });
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* --- HISTORIAL / LISTA (DERECHA) --- */}
                <div className="col-lg-4 d-flex flex-column">
                    <div className="card shadow-sm border-0 bg-white h-100 d-flex flex-column" style={{ minHeight: '0' }}>

                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 fw-bold text-secondary">Equipo Actual ({listaColaboradores.length})</h6>
                        </div>

                        <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <div className="list-group list-group-flush shadow-sm">
                                {listaColaboradores.map(c => (
                                    <div
                                        key={c.id}
                                        className={`list-group-item d-flex align-items-center gap-3 p-3 transition-all ${idEdicion === c.id ? 'bg-primary bg-opacity-10 border-primary' : ''}`}
                                        style={idEdicion === c.id ? { borderLeft: '4px solid #0d6efd' } : {}}
                                    >
                                        <div style={{ width: '40px', height: '40px' }} className="flex-shrink-0">
                                            {c.foto_url ? (
                                                <img src={c.foto_url} className="w-100 h-100 rounded-circle object-fit-cover border" alt={c.nombre} />
                                            ) : (
                                                <div className="w-100 h-100 rounded-circle bg-light border d-flex align-items-center justify-content-center text-secondary fw-bold small">{c.nombre.charAt(0)}</div>
                                            )}
                                        </div>
                                        <div className="flex-grow-1 lh-1">
                                            <h6 className={`mb-1 fs-6 fw-bold ${idEdicion === c.id ? 'text-primary' : 'text-dark'}`}>{c.nombre}</h6>
                                            <small className="text-muted d-block text-truncate" style={{ fontSize: '0.8rem', maxWidth: '180px' }}>
                                                {c.cargo}
                                                {/* Mostramos la profesión en la lista también si existe */}
                                                {c.profesion && <span className="text-primary opacity-75"> • {c.profesion}</span>}
                                            </small>
                                        </div>
                                        <div>
                                            <button onClick={() => cargarDatosParaEditar(c)} className="btn btn-sm btn-light text-primary me-1" title="Editar"><i className="bi bi-pencil"></i></button>
                                            <button onClick={() => handleDelete(c.id)} className="btn btn-sm btn-light text-danger" title="Eliminar"><i className="bi bi-trash"></i></button>
                                        </div>
                                    </div>
                                ))}
                                {listaColaboradores.length === 0 && (
                                    <div className="text-center p-5 text-muted small">No hay integrantes registrados.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}