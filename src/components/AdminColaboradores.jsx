import { useState, useEffect, useRef } from 'react';
import { supabase, uploadImage } from '../lib/supabase';

// --- COMPONENTE AVATAR LIMPIO ---
const AvatarUpload = ({ image, onUpload, onRemove, subiendo }) => {
    const fileInputRef = useRef(null);

    return (
        <div className="d-flex flex-column align-items-center justify-content-center h-100">
            {/* Círculo de la imagen */}
            <div 
                className="position-relative rounded-circle shadow-sm d-flex align-items-center justify-content-center bg-white border border-2 transition-all overflow-hidden"
                style={{ 
                    width: '160px', 
                    height: '160px', 
                    cursor: image ? 'default' : 'pointer',
                    borderColor: '#f0f0f0'
                }}
                onClick={() => !image && fileInputRef.current.click()}
            >
                {subiendo ? (
                    <div className="spinner-border text-primary" role="status"></div>
                ) : image ? (
                    <img src={image} className="w-100 h-100 object-fit-cover" alt="Perfil" />
                ) : (
                    <div className="text-center text-secondary opacity-50">
                        <i className="bi bi-camera-fill display-4"></i>
                        <div className="small fw-bold mt-1">SUBIR FOTO</div>
                    </div>
                )}
                
                {/* Input oculto */}
                <input type="file" hidden ref={fileInputRef} onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} accept="image/*" />
            </div>

            {/* Controles debajo de la imagen (Minimalista) */}
            <div className="mt-3 text-center">
                {image ? (
                    <button type="button" className="btn btn-link text-danger text-decoration-none btn-sm fw-bold p-0" onClick={onRemove}>
                        <i className="bi bi-trash me-1"></i>Eliminar foto
                    </button>
                ) : (
                    <span className="text-muted small fst-italic">Clic en el círculo</span>
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
        nombre: '', cargo: '', email: '', bio: '', foto_url: '', linkedin: ''
    });

    useEffect(() => { fetchColaboradores(); }, []);

    const fetchColaboradores = async () => {
        try { const { data } = await supabase.from('colaboradores').select('*').order('id', { ascending: true }); if (data) setListaColaboradores(data); } catch (error) { console.error(error); }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleUpload = async (file) => {
        try { setSubiendo(true); const url = await uploadImage(file); setFormData(prev => ({ ...prev, foto_url: url })); } 
        catch (error) { alert(error.message); } finally { setSubiendo(false); }
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
            setFormData({ nombre: '', cargo: '', email: '', bio: '', foto_url: '', linkedin: '' });
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

    const handleDelete = async (id) => { if (confirm('¿Eliminar colaborador?')) { await supabase.from('colaboradores').delete().eq('id', id); fetchColaboradores(); } };

    return (
        <div className="container py-4">
            <h2 className="mb-4 fw-bold" style={{ color: '#003767' }}>Gestión de Equipo</h2>
            
            {mensaje && (
                <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show`}>
                    {mensaje.texto} <button className="btn-close" onClick={() => setMensaje(null)}></button>
                </div>
            )}

            <div className="row g-4 align-items-stretch">
                {/* COLUMNA IZQUIERDA: FORMULARIO */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 bg-white" id="form-top">
                        <div className="card-body p-4">
                            <h5 className="card-title mb-4 fw-bold text-dark border-bottom pb-2">
                                <i className={`bi ${idEdicion ? 'bi-pencil-square' : 'bi-person-plus-fill'} me-2`} style={{color: '#003767'}}></i>
                                {idEdicion ? 'Editar Perfil' : 'Nuevo Integrante'}
                            </h5>
                            
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    {/* 1. SECCIÓN FOTO (COLUMNA IZQUIERDA DENTRO DEL FORM) */}
                                    <div className="col-md-4 mb-4 mb-md-0 border-end-md">
                                        <AvatarUpload 
                                            image={formData.foto_url} 
                                            onUpload={handleUpload} 
                                            onRemove={() => setFormData({...formData, foto_url: ''})} 
                                            subiendo={subiendo}
                                        />
                                    </div>

                                    {/* 2. SECCIÓN DATOS (COLUMNA DERECHA DENTRO DEL FORM) */}
                                    <div className="col-md-8 ps-md-4">
                                        <div className="mb-3">
                                            <label className="form-label fw-bold small text-secondary">Nombre Completo <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" name="nombre" required value={formData.nombre} onChange={handleChange} placeholder="Ej: Dra. Ana Pérez" />
                                        </div>
                                        
                                        <div className="mb-3">
                                            <label className="form-label fw-bold small text-secondary">Cargo <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" name="cargo" required value={formData.cargo} onChange={handleChange} placeholder="Ej: Investigadora Principal" />
                                        </div>

                                        <div className="row g-2 mb-3">
                                            <div className="col-6">
                                                <label className="form-label fw-bold small text-secondary">Email</label>
                                                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label fw-bold small text-secondary">LinkedIn</label>
                                                <input type="url" className="form-control" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://..." />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. SECCIÓN BIOGRAFÍA (ANCHO COMPLETO ABAJO) */}
                                <div className="mt-3">
                                    <label className="form-label fw-bold small text-secondary">Biografía Breve</label>
                                    <textarea className="form-control" name="bio" rows="3" value={formData.bio} onChange={handleChange} placeholder="Pequeña reseña profesional..."></textarea>
                                </div>

                                <div className="d-grid gap-2 d-md-flex mt-4 pt-2 border-top">
                                    <button type="submit" className="btn fw-bold px-4 flex-grow-1 text-white" style={{ backgroundColor: '#003767' }} disabled={subiendo}>
                                        {idEdicion ? 'Guardar Cambios' : 'Añadir al Equipo'}
                                    </button>
                                    {idEdicion && <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setIdEdicion(null); setFormData({ nombre: '', cargo: '', email: '', bio: '', foto_url: '', linkedin: '' }); }}>Cancelar</button>}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: LISTADO */}
                <div className="col-lg-4 d-flex flex-column">
                    <div className="card shadow-sm border-0 bg-white h-100 d-flex flex-column" style={{minHeight: '0'}}>
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold text-secondary">Equipo ({listaColaboradores.length})</h5>
                        </div>
                        <div className="list-group list-group-flush flex-grow-1 overflow-y-auto" style={{ minHeight: '0' }}>
                            {listaColaboradores.map(c => {
                                const isEditing = idEdicion === c.id;
                                return (
                                    <div key={c.id} className={`list-group-item p-3 border-0 border-bottom d-flex align-items-center gap-3 ${isEditing ? 'bg-primary-subtle border-start border-4 border-primary' : ''}`}>
                                        <div className="flex-shrink-0">
                                            {c.foto_url ? (
                                                <img 
                                                    src={c.foto_url} alt="" className="rounded-circle object-fit-cover border shadow-sm" width="45" height="45" 
                                                />
                                            ) : (
                                                <div className="rounded-circle bg-light text-secondary fw-bold d-flex align-items-center justify-content-center border" style={{ width: '45px', height: '45px' }}>{c.nombre.charAt(0)}</div>
                                            )}
                                        </div>
                                        <div className="flex-grow-1 lh-1">
                                            <h6 className={`mb-1 fs-6 fw-bold ${isEditing ? 'text-primary' : 'text-dark'}`}>{c.nombre}</h6>
                                            <small className="text-muted" style={{fontSize: '0.8rem'}}>{c.cargo}</small>
                                        </div>
                                        <div className="d-flex gap-1">
                                            <button onClick={() => cargarDatosParaEditar(c)} className={`btn btn-sm ${isEditing ? 'btn-primary' : 'btn-outline-light text-secondary border'}`}><i className="bi bi-pencil-fill"></i></button>
                                            <button onClick={() => handleDelete(c.id)} className="btn btn-sm btn-outline-light text-danger border"><i className="bi bi-trash-fill"></i></button>
                                        </div>
                                    </div>
                                );
                            })}
                            {listaColaboradores.length === 0 && (
                                <div className="text-center p-5 text-muted small">No hay integrantes.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}