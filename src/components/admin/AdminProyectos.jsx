import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminGlobal.module.css';


const Editor = lazy(() => import('react-simple-wysiwyg').then(module => ({ default: module.default || module })));

// --- ZONA DE CARGA TIPO TARJETA---
const UploadZone = ({ image, onUpload, onRemove, subiendo, position, onPositionChange, required }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const sliderValue = (position !== undefined && position !== null) ? parseInt(position) : 50;

    return (
        <div className="h-100 d-flex flex-column">
            <label className="form-label fw-bold small text-secondary">
                Portada (Vista Previa Tarjeta) {required && <span className="text-danger">*</span>}
            </label>

            {/* CONTENEDOR */}
            <div
                className={`flex-grow-1 position-relative rounded-3 d-flex flex-column align-items-center justify-content-center text-center overflow-hidden border ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
                style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderStyle: image ? 'solid' : 'dashed',
                    cursor: image ? 'default' : 'pointer',
                    borderColor: isDragging ? '#003767' : '#dee2e6'
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file?.type.startsWith('image/')) onUpload(file); }}
                onClick={() => !image && fileInputRef.current.click()}
            >
                <input type="file" hidden ref={fileInputRef} onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} accept="image/*" />

                {subiendo ? (
                    <div className="text-primary"><div className="spinner-border spinner-border-sm mb-2"></div><p className="small mb-0 fw-bold">Subiendo...</p></div>
                ) : image ? (
                    <div className="w-100 h-100 position-relative">
                        <img
                            src={image}
                            className="w-100 h-100 d-block"
                            style={{
                                objectFit: 'cover',
                                objectPosition: `center ${sliderValue}%`,
                                transition: 'none'
                            }}
                            alt="Preview"
                        />

                        <div className="position-absolute top-0 end-0 m-2">
                            <button type="button" className="btn btn-danger btn-sm shadow" onClick={(e) => { e.stopPropagation(); onRemove(); }}><i className="bi bi-trash"></i></button>
                        </div>

                        {/* SLIDER DE CONTROL VERTICAL */}
                        {onPositionChange && (
                            <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-75 p-2 px-3" onClick={(e) => e.stopPropagation()}>
                                <div className="d-flex justify-content-between align-items-center text-white small fw-bold mb-1">
                                    <span style={{ fontSize: '0.7rem' }}>Ajuste Vertical</span>
                                    <span style={{ fontSize: '0.7rem' }}>{sliderValue}%</span>
                                </div>
                                <input
                                    type="range"
                                    className="form-range form-range-sm"
                                    min="0" max="100" step="1"
                                    value={sliderValue}
                                    onChange={(e) => onPositionChange(parseInt(e.target.value))}
                                    style={{ cursor: 'ew-resize' }}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-muted pe-none p-3">
                        <i className="bi bi-image display-4 mb-2 opacity-50"></i>
                        <p className="small fw-bold mb-0 text-dark">Subir Portada</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente para logos de socios/financiamiento
const MiniUpload = ({ image, onUpload, onDelete }) => {
    const fileInputRef = useRef(null);
    return (
        <div className="flex-shrink-0 position-relative" style={{ width: '40px', height: '40px' }}>
            <input type="file" hidden ref={fileInputRef} onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} accept="image/*" />
            {image ? (
                <>
                    <img src={image} className="w-100 h-100 rounded object-fit-contain border bg-white" alt="Logo" />
                    <button type="button" className="btn btn-danger p-0 rounded-circle position-absolute top-0 end-0 translate-middle shadow-sm" style={{ width: '16px', height: '16px', fontSize: '8px' }} onClick={onDelete}>✕</button>
                </>
            ) : (
                <button type="button" className="btn btn-light border w-100 h-100 p-0 d-flex flex-column align-items-center justify-content-center text-muted" onClick={() => fileInputRef.current.click()}>
                    <i className="bi bi-plus"></i>
                </button>
            )}
        </div>
    );
};

// --- FUNCIÓN HELPER PARA SUBIR IMÁGENES ---
const uploadImage = async (file) => {
    if (!file) return null;

    // 1. Generar nombre único 
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 2. Subir al bucket 
    const { error: uploadError } = await supabase.storage
        .from('proyectos')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    // 3. Obtener URL pública para guardarla en la BD
    const { data } = supabase.storage
        .from('proyectos')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

export default function AdminProyectos() {
    const [listaProyectos, setListaProyectos] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const [subiendoGlobal, setSubiendoGlobal] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);

    const [formData, setFormData] = useState({
        title: '', resumen: '', description: '', area: '', status: '',
        image_url: '', image_position: 50,
        fecha_inicio: '', fecha_termino: '', link_externo: '', socios: [], financiamiento: []
    });

    useEffect(() => { fetchProyectos(); }, []);

    const fetchProyectos = async () => {
        try {
            const { data, error } = await supabase.from('proyectos').select('*').order('id', { ascending: false });
            if (error) throw error;
            if (data) setListaProyectos(data);
        } catch (error) { console.error(error); }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleUploadPortada = async (file) => {
        try { setSubiendoGlobal(true); const url = await uploadImage(file); setFormData(prev => ({ ...prev, image_url: url })); }
        catch (error) { alert(error.message); } finally { setSubiendoGlobal(false); }
    };

    const handleUploadItem = async (campo, index, file) => {
        try { setSubiendoGlobal(true); const url = await uploadImage(file); const nuevaLista = [...formData[campo]]; nuevaLista[index].imagen = url; setFormData(prev => ({ ...prev, [campo]: nuevaLista })); }
        catch (error) { alert(error.message); } finally { setSubiendoGlobal(false); }
    };
    const agregarItem = (campo) => { setFormData({ ...formData, [campo]: [...formData[campo], { nombre: '', imagen: '' }] }); };
    const eliminarItem = (campo, index) => { setFormData({ ...formData, [campo]: formData[campo].filter((_, i) => i !== index) }); };
    const updateItem = (campo, index, key, value) => { const nuevaLista = [...formData[campo]]; nuevaLista[index][key] = value; setFormData({ ...formData, [campo]: nuevaLista }); };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.description || formData.description.trim() === '') {
            setMensaje({ tipo: 'danger', texto: 'La descripción detallada es obligatoria.' });
            return;
        }

        const datosEnvio = { ...formData, fecha_termino: formData.fecha_termino || null, link_externo: formData.link_externo || null, image_position: formData.image_position || 50 };
        try {
            if (idEdicion) {
                const { error } = await supabase.from('proyectos').update(datosEnvio).eq('id', idEdicion);
                if (error) throw error;
                setMensaje({ tipo: 'success', texto: 'Proyecto actualizado correctamente' });
            } else {
                const { error } = await supabase.from('proyectos').insert([datosEnvio]);
                if (error) throw error;
                setMensaje({ tipo: 'success', texto: 'Proyecto creado correctamente' });
            }
            // Reset completo
            setFormData({ title: '', resumen: '', description: '', area: '', status: '', image_url: '', image_position: 50, fecha_inicio: '', fecha_termino: '', link_externo: '', socios: [], financiamiento: [] });
            setIdEdicion(null);
            fetchProyectos();
            document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) { setMensaje({ tipo: 'danger', texto: error.message }); }
    };

    const cargarDatosParaEditar = (p) => {
        let pos = (p.image_position !== undefined && p.image_position !== null) ? parseInt(p.image_position) : 50;
        if (isNaN(pos)) pos = 50;

        setFormData({ ...p, socios: p.socios || [], financiamiento: p.financiamiento || [], image_position: pos });
        setIdEdicion(p.id);
        document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (confirm('¿Borrar este proyecto?')) {
            const { error } = await supabase.from('proyectos').delete().eq('id', id);
            if (!error) fetchProyectos();
        }
    };

    return (
        <div className="container py-4">
            <h2 className={`mb-4 ${styles.titulo}`}>Gestión de Proyectos</h2>

            {mensaje && (
                <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show`}>
                    {mensaje.texto} <button className="btn-close" onClick={() => setMensaje(null)}></button>
                </div>
            )}

            <div className="row g-4 align-items-stretch">
                {/* COLUMNA IZQUIERDA: EDITOR */}
                <div className="col-lg-8">
                    <div className={`card shadow-sm border-0 ${styles.contenedor}`} id="form-top">
                        <div className="card-body p-4">
                            <h5 className="card-title mb-4 fw-bold text-dark border-bottom pb-2">
                                <i className={`bi ${idEdicion ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: '#003767' }}></i>
                                {idEdicion ? 'Editar' : 'Nuevo'} Proyecto
                            </h5>

                            <form onSubmit={handleSubmit}>
                                <div className="row mb-4">
                                    {/* ZONA DE CARGA DE IMAGEN */}
                                    <div className="col-md-5 mb-4 mb-md-0">
                                        <UploadZone
                                            image={formData.image_url}
                                            onUpload={handleUploadPortada}
                                            onRemove={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                            subiendo={subiendoGlobal}
                                            position={formData.image_position}
                                            onPositionChange={(pos) => setFormData(prev => ({ ...prev, image_position: pos }))}
                                            required={true}
                                        />
                                    </div>

                                    <div className="col-md-7">
                                        <div className="mb-3">
                                            <label className="fw-bold small mb-1 text-secondary">Título <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" name="title" required value={formData.title} onChange={handleChange} placeholder="Nombre del proyecto" />
                                        </div>

                                        <div className="row g-2 mb-3">
                                            <div className="col-6">
                                                <label className="fw-bold small mb-1 text-secondary">Área <span className="text-danger">*</span></label>
                                                <input list="areas-options" className="form-control" name="area" required value={formData.area} onChange={handleChange} placeholder="Seleccionar..." />
                                                <datalist id="areas-options"><option value="Energía" /><option value="Tecnología" /><option value="Medio Ambiente" /><option value="Educación" /></datalist>
                                            </div>
                                            <div className="col-6">
                                                <label className="fw-bold small mb-1 text-secondary">Estado <span className="text-danger">*</span></label>
                                                <input list="status-options" className="form-control" name="status" required value={formData.status} onChange={handleChange} placeholder="Seleccionar..." />
                                                <datalist id="status-options"><option value="En curso" /><option value="Finalizado" /><option value="En planificación" /></datalist>
                                            </div>
                                        </div>

                                        <div className="row g-2 mb-3">
                                            <div className="col-6">
                                                <label className="fw-bold small mb-1 text-secondary">Inicio <span className="text-danger">*</span></label>
                                                <input type="date" className="form-control" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} required />
                                            </div>
                                            <div className="col-6">
                                                <label className="fw-bold small mb-1 text-secondary">Término</label>
                                                <input type="date" className="form-control" name="fecha_termino" value={formData.fecha_termino} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12 mt-2">
                                        <label className="fw-bold small mb-1 text-secondary">Resumen Corto</label>
                                        <textarea className="form-control" name="resumen" rows="2" maxLength={150} value={formData.resumen} onChange={handleChange} placeholder="Máx 150 caracteres (para la tarjeta)..." />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="fw-bold small mb-2 text-secondary">Descripción Detallada <span className="text-danger">*</span></label>
                                    <div className="shadow-sm bg-white border rounded" style={{ minHeight: '200px' }}>
                                        <Suspense fallback={<div className="p-3 text-center">Cargando editor...</div>}>
                                            <Editor value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} containerProps={{ style: { height: '300px' } }} />
                                        </Suspense>
                                    </div>
                                </div>

                                {/* SECCIÓN SOCIOS Y FINANCIAMIENTO */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="bg-light p-3 rounded border h-100">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <label className="fw-bold text-dark small mb-0">Socios</label>
                                                <button type="button" className="btn btn-sm btn-link p-0 fw-bold" onClick={() => agregarItem('socios')}>+ Añadir</button>
                                            </div>
                                            <div className="d-flex flex-column gap-2">
                                                {formData.socios.map((socio, index) => (
                                                    <div key={index} className="d-flex align-items-center gap-2 bg-white p-2 rounded border shadow-sm">
                                                        <MiniUpload image={socio.imagen} onUpload={(file) => handleUploadItem('socios', index, file)} onDelete={() => updateItem('socios', index, 'imagen', '')} />
                                                        <input type="text" className="form-control form-control-sm border-0 bg-light" placeholder="Nombre" value={socio.nombre} onChange={(e) => updateItem('socios', index, 'nombre', e.target.value)} />
                                                        <button type="button" className="btn btn-sm text-danger" onClick={() => eliminarItem('socios', index)}>×</button>
                                                    </div>
                                                ))}
                                                {formData.socios.length === 0 && <p className="text-center text-muted small fst-italic mb-0 py-2">Sin socios.</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="bg-light p-3 rounded border h-100">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <label className="fw-bold text-dark small mb-0">Financiamiento</label>
                                                <button type="button" className="btn btn-sm btn-link p-0 fw-bold" onClick={() => agregarItem('financiamiento')}>+ Añadir</button>
                                            </div>
                                            <div className="d-flex flex-column gap-2">
                                                {formData.financiamiento.map((fin, index) => (
                                                    <div key={index} className="d-flex align-items-center gap-2 bg-white p-2 rounded border shadow-sm">
                                                        <MiniUpload image={fin.imagen} onUpload={(file) => handleUploadItem('financiamiento', index, file)} onDelete={() => updateItem('financiamiento', index, 'imagen', '')} />
                                                        <input type="text" className="form-control form-control-sm border-0 bg-light" placeholder="Fuente" value={fin.nombre} onChange={(e) => updateItem('financiamiento', index, 'nombre', e.target.value)} />
                                                        <button type="button" className="btn btn-sm text-danger" onClick={() => eliminarItem('financiamiento', index)}>×</button>
                                                    </div>
                                                ))}
                                                {formData.financiamiento.length === 0 && <p className="text-center text-muted small fst-italic mb-0 py-2">Sin financiamiento.</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-grid gap-2 d-md-flex">
                                    <button type="submit" className="btn fw-bold py-2 px-5 text-white flex-grow-1" style={{ backgroundColor: '#003767' }} disabled={subiendoGlobal}>
                                        {subiendoGlobal ? 'Subiendo...' : (idEdicion ? 'Guardar Cambios' : 'Crear Proyecto')}
                                    </button>
                                    {idEdicion && <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setIdEdicion(null); setFormData({ title: '', resumen: '', description: '', area: '', status: '', image_url: '', fecha_inicio: '', fecha_termino: '', link_externo: '', socios: [], financiamiento: [], image_position: 50 }); }}>Cancelar</button>}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: HISTORIAL */}
                <div className="col-lg-4 d-flex flex-column">
                    <div className="card shadow-sm border-0 bg-white h-100 d-flex flex-column" style={{ minHeight: '0' }}>
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold text-secondary">Historial ({listaProyectos.length})</h5>
                        </div>
                        <div className="list-group list-group-flush flex-grow-1 overflow-y-auto" style={{ minHeight: '0' }}>
                            {listaProyectos.map(p => {
                                const isEditing = idEdicion === p.id;
                                return (
                                    <div key={p.id} className={`list-group-item p-3 border-0 border-bottom d-flex align-items-start gap-3 ${isEditing ? 'bg-primary-subtle border-start border-4 border-primary' : ''}`}>
                                        <div className="bg-light rounded d-flex align-items-center justify-content-center border overflow-hidden" style={{ width: '60px', height: '35px', flexShrink: 0 }}>
                                            {p.image_url ? (
                                                <img src={p.image_url} className="w-100 h-100" style={{ objectFit: 'cover', objectPosition: `center ${p.image_position || 50}%` }} alt="" />
                                            ) : <i className="bi bi-image text-muted"></i>}
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className={`mb-1 fw-bold small ${isEditing ? 'text-primary' : 'text-dark'}`}>{p.title}</h6>
                                            <span className="badge bg-light text-dark border me-1">{p.area}</span>
                                        </div>
                                        <div className="d-flex flex-column gap-1">
                                            <button onClick={() => cargarDatosParaEditar(p)} className={`btn btn-sm ${isEditing ? 'btn-primary' : 'btn-outline-light text-secondary border'}`}><i className="bi bi-pencil"></i></button>
                                            <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-outline-light text-danger border"><i className="bi bi-trash"></i></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}