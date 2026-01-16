import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminGlobal.module.css';

// --- COMPONENTE AVATAR MEJORADO (CON DRAG & DROP Y PASTE) ---
const AvatarUpload = ({ image, onUpload, onRemove, subiendo }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // 1. Manejo de PEGAR imagen (Ctrl+V)
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
        // Escuchamos el evento paste en toda la ventana cuando este componente está montado
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [onUpload]);

    // 2. Manejadores de ARRASTRAR (Drag & Drop)
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            onUpload(file);
        }
    };

    return (
        <div className="d-flex flex-column align-items-center justify-content-center h-100">
            <div 
                // Clases dinámicas: si arrastras, se pone azul (border-primary) y fondo suave
                className={`position-relative rounded-circle shadow-sm d-flex align-items-center justify-content-center transition-all overflow-hidden border border-2 
                ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-white'}`}
                style={{ 
                    width: '160px', 
                    height: '160px', 
                    cursor: image ? 'default' : 'pointer',
                    borderColor: isDragging ? '#0d6efd' : '#f0f0f0' // Refuerzo visual
                }}
                // Eventos de Drag & Drop
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                // Click para abrir selector clásico
                onClick={() => !image && fileInputRef.current.click()}
            >
                {subiendo ? (
                    <div className="spinner-border text-primary" role="status"></div>
                ) : image ? (
                    <img src={image} className="w-100 h-100 object-fit-cover" alt="Perfil" />
                ) : (
                    <div className={`text-center transition-all ${isDragging ? 'text-primary' : 'text-secondary opacity-50'}`}>
                        {/* El ícono cambia si estás arrastrando algo encima */}
                        <i className={`bi ${isDragging ? 'bi-cloud-upload-fill' : 'bi-camera-fill'} display-4`}></i>
                        <div className="small fw-bold mt-1">
                            {isDragging ? 'SOLTAR AQUÍ' : 'SUBIR FOTO'}
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
                    <span className="text-muted small fst-italic" style={{fontSize: '0.8rem'}}>
                        Click en el círculo
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

    const [formData, setFormData] = useState({
        nombre: '', cargo: '', facultad: '', email: '', bio: '', foto_url: '', linkedin: ''
    });

    useEffect(() => { fetchColaboradores(); }, []);

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
            alert(error.message); 
        } finally { 
            setSubiendo(false); 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const datosEnvio = { ...formData, linkedin: formData.linkedin || null, email: formData.email || null };
        try {
            if (idEdicion) {
                const { error } = await supabase.from('colaboradores').update(datosEnvio).eq('id', idEdicion);
                if (error) throw error;
                setMensaje({ tipo: 'success', texto: 'Actualizado correctamente' });
            } else {
                const { error } = await supabase.from('colaboradores').insert([datosEnvio]);
                if (error) throw error;
                setMensaje({ tipo: 'success', texto: 'Añadido correctamente' });
            }
            setFormData({ nombre: '', cargo: '', facultad: '', email: '', bio: '', foto_url: '', linkedin: '' });
            setIdEdicion(null);
            fetchColaboradores();
            document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) { setMensaje({ tipo: 'danger', texto: error.message }); }
    };

    const cargarDatosParaEditar = (c) => {
        setFormData({ ...c, email: c.email || '', linkedin: c.linkedin || '' });
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
            {/* TÍTULO */}
            <h2 className={`mb-4 ${styles.titulo}`}>Gestión de Colaboradores</h2>            
            
            {mensaje && (
                <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show`}>
                    {mensaje.texto}
                    <button className="btn-close" onClick={() => setMensaje(null)}></button>
                </div>
            )}

            <div className="row g-4 align-items-stretch">
                {/* FORMULARIO */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 bg-white" id="form-top">
                        <div className="card-body p-4">
                            
                            {/* ENCABEZADO TIPO ADMIN NOTICIAS */}
                            <h5 className="card-title mb-4 fw-bold text-dark border-bottom pb-2">
                                <i className={`bi ${idEdicion ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: '#003767' }}></i>
                                {idEdicion ? 'Editar' : 'Nuevo'} Integrante
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
                                                <label className="form-label small fw-bold">Nombre Completo <span className="text-danger">*</span></label>
                                                <input type="text" className="form-control" name="nombre" required value={formData.nombre} onChange={handleChange} placeholder="Ej. Dra. Ana Pérez" />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-bold">Cargo / Rol <span className="text-danger">*</span></label>
                                                <input type="text" className="form-control" name="cargo" required value={formData.cargo} onChange={handleChange} placeholder="Ej. Investigadora Principal" />
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label small fw-bold">Facultad</label>
                                                <input type="text" className="form-control" name="facultad" value={formData.facultad} onChange={handleChange} placeholder="Ej. Fac. de Ingeniería y Ciencias" />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Email</label>
                                                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} placeholder="correo@institucion.cl" />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">LinkedIn (URL)</label>
                                                <input type="url" className="form-control" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-bold">Breve Biografía</label>
                                                <textarea className="form-control" name="bio" rows="3" value={formData.bio} onChange={handleChange} placeholder="Descripción corta del perfil profesional..."></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 d-flex gap-2 justify-content-end border-top pt-3">
                                    {/* BOTONES UNIFICADOS CON ADMIN PROYECTOS */}
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
                                                setFormData({ nombre: '', cargo: '', facultad: '', email: '', bio: '', foto_url: '', linkedin: '' }); 
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

                {/* LISTADO ESTILO ADMIN NOTICIAS */}
                <div className="col-lg-4 d-flex flex-column">
                    <div className="card shadow-sm border-0 bg-white h-100 d-flex flex-column" style={{minHeight: '0'}}>
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 fw-bold text-dark">Equipo Actual ({listaColaboradores.length})</h6>
                        </div>
                        <div className="card-body p-0 overflow-auto" style={{ maxHeight: '600px' }}>
                            <div className="list-group list-group-flush">
                                {listaColaboradores.map(c => (
                                    <div 
                                        key={c.id} 
                                        className={`list-group-item d-flex align-items-center gap-3 p-3 transition-all ${idEdicion === c.id ? 'bg-primary bg-opacity-10 border-primary' : ''}`}
                                        style={idEdicion === c.id ? {borderLeft: '4px solid #0d6efd'} : {}}
                                    >
                                        <div style={{width: '40px', height: '40px'}} className="flex-shrink-0">
                                            {c.foto_url ? (
                                                <img src={c.foto_url} className="w-100 h-100 rounded-circle object-fit-cover border" alt={c.nombre} />
                                            ) : (
                                                <div className="w-100 h-100 rounded-circle bg-light border d-flex align-items-center justify-content-center text-secondary fw-bold small">{c.nombre.charAt(0)}</div>
                                            )}
                                        </div>
                                        <div className="flex-grow-1 lh-1">
                                            <h6 className={`mb-1 fs-6 fw-bold ${idEdicion === c.id ? 'text-primary' : 'text-dark'}`}>{c.nombre}</h6>
                                            <small className="text-muted" style={{fontSize: '0.8rem'}}>{c.cargo}</small>
                                        </div>
                                        <div>
                                            {/* ICONOS UNIFICADOS (LÁPIZ Y BASURERO) */}
                                            <button onClick={() => cargarDatosParaEditar(c)} className="btn btn-sm btn-light text-primary me-1" title="Editar"><i className="bi bi-pencil"></i></button>
                                            <button onClick={() => handleDelete(c.id)} className="btn btn-sm btn-light text-danger" title="Eliminar"><i className="bi bi-trash"></i></button>
                                        </div>
                                    </div>
                                ))}
                                {listaColaboradores.length === 0 && (
                                    <div className="text-center p-5 text-muted small">No hay integrantes.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}