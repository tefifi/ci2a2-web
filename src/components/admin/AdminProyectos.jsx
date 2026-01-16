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
                Portada (16:9) {required && <span className="text-danger">*</span>}
            </label>

            <div
                className={`flex-grow-1 position-relative rounded-3 d-flex flex-column align-items-center justify-content-center text-center transition-all overflow-hidden border ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
                style={{ 
                    minHeight: '200px', 
                    cursor: image ? 'default' : 'pointer',
                    borderStyle: image ? 'solid' : 'dashed',
                    borderColor: isDragging ? '#0d6efd' : '#dee2e6' 
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
                {subiendo ? (
                    <div className="text-primary"><div className="spinner-border spinner-border-sm mb-2"></div><p className="small mb-0 fw-bold">Subiendo...</p></div>
                ) : image ? (
                    <>
                        <img src={image} className="w-100 h-100 object-fit-cover position-absolute top-0 start-0" alt="Portada" />
                        <button type="button" className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 shadow-sm" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
                            <i className="bi bi-trash"></i>
                        </button>
                    </>
                ) : (
                    <div className="text-muted p-3">
                        <i className={`bi ${isDragging ? 'bi-cloud-upload-fill text-primary' : 'bi-images opacity-25'} fs-1 mb-2`}></i>
                        <p className="small fw-bold mb-0">Arrastra o pega imagen</p>
                    </div>
                )}
                <input type="file" hidden ref={fileInputRef} onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} accept="image/*" />
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

const uploadImage = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('proyectos').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('proyectos').getPublicUrl(fileName);
    return data.publicUrl;
};

export default function AdminProyectos() {
    const [listaProyectos, setListaProyectos] = useState([]);
    const [subiendoGlobal, setSubiendoGlobal] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    const [mensaje, setMensaje] = useState(null); // Feedback visual

    const [formData, setFormData] = useState({
        title: '', resumen: '', description: '', area: '', status: '',
        image_url: '', fecha_inicio: '', fecha_termino: '', link_externo: '', socios: [], financiamiento: []
    });

    useEffect(() => { fetchProyectos(); }, []);

    // Limpiar mensaje automáticamente
    useEffect(() => {
        if (mensaje) {
            const timer = setTimeout(() => setMensaje(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    const fetchProyectos = async () => {
        const { data } = await supabase.from('proyectos').select('*').order('id', { ascending: false });
        if (data) setListaProyectos(data);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleUploadPortada = async (file) => {
        try { setSubiendoGlobal(true); const url = await uploadImage(file); setFormData(prev => ({ ...prev, image_url: url })); }
        catch (error) { setMensaje({ tipo: 'danger', texto: "Error al subir imagen" }); } finally { setSubiendoGlobal(false); }
    };

    const handleUploadItem = async (campo, index, file) => {
        try { setSubiendoGlobal(true); const url = await uploadImage(file); const nuevaLista = [...formData[campo]]; nuevaLista[index].imagen = url; setFormData(prev => ({ ...prev, [campo]: nuevaLista })); }
        catch (error) { setMensaje({ tipo: 'danger', texto: "Error al subir imagen" }); } finally { setSubiendoGlobal(false); }
    };

    const agregarItem = (campo) => { setFormData({ ...formData, [campo]: [...formData[campo], { nombre: '', imagen: '' }] }); };
    const eliminarItem = (campo, index) => { setFormData({ ...formData, [campo]: formData[campo].filter((_, i) => i !== index) }); };
    const updateItem = (campo, index, key, value) => { const nuevaLista = [...formData[campo]]; nuevaLista[index][key] = value; setFormData({ ...formData, [campo]: nuevaLista }); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const datosEnvio = { ...formData, fecha_termino: formData.fecha_termino || null, link_externo: formData.link_externo || null };
        try {
            if (idEdicion) {
                await supabase.from('proyectos').update(datosEnvio).eq('id', idEdicion);
                setMensaje({ tipo: 'success', texto: '¡Proyecto actualizado correctamente!' });
            } else {
                await supabase.from('proyectos').insert([datosEnvio]);
                setMensaje({ tipo: 'success', texto: '¡Proyecto creado correctamente!' });
            }
            resetForm();
            fetchProyectos();
            document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) { setMensaje({ tipo: 'danger', texto: error.message }); }
    };

    const resetForm = () => {
        setFormData({ title: '', resumen: '', description: '', area: '', status: '', image_url: '', fecha_inicio: '', fecha_termino: '', link_externo: '', socios: [], financiamiento: [] });
        setIdEdicion(null);
    };

    const cargarDatosParaEditar = (p) => {
        setFormData({ ...p, socios: p.socios || [], financiamiento: p.financiamiento || [] });
        setIdEdicion(p.id);
        document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (confirm('¿Borrar este proyecto?')) {
            await supabase.from('proyectos').delete().eq('id', id);
            fetchProyectos();
        }
    };

    return (
        <div className={styles.contenedor}>
            <h2 className={`mb-4 ${styles.titulo}`}>Gestión de Proyectos</h2>

            {/* ALERTA DE FEEDBACK */}
            {mensaje && (
                <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show shadow-sm border-0`}>
                    <i className={`bi ${mensaje.tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    {mensaje.texto}
                    <button className="btn-close" onClick={() => setMensaje(null)}></button>
                </div>
            )}

            <div className="row g-4">
                {/* COLUMNA IZQUIERDA: EDITOR */}
                <div className="col-lg-8">
                    <form onSubmit={handleSubmit} className="card p-4 shadow-sm border-0 h-100" id="form-top">

                        <h5 className="card-title mb-4 fw-bold text-dark border-bottom pb-2">
                            <i className={`bi ${idEdicion ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: '#003767' }}></i>
                            {idEdicion ? 'Editar' : 'Nuevo'} Proyecto
                        </h5>

                        <div className="row mb-3">
                            <div className="col-md-5 mb-3 mb-md-0">
                                <UploadZone
                                    image={formData.image_url}
                                    onUpload={handleUploadPortada}
                                    onRemove={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                    subiendo={subiendoGlobal}
                                    required
                                />
                            </div>

                            <div className="col-md-7">
                                <div className="mb-2">
                                    <label className="form-label fw-bold small text-secondary">Título <span className="text-danger">*</span></label>
                                    <input type="text" className="form-control fw-bold" name="title" required value={formData.title} onChange={handleChange} placeholder="Nombre del proyecto" />
                                </div>

                                <div className="row g-2 mb-2">
                                    <div className="col-6">
                                        <label className="form-label fw-bold small text-secondary">Área <span className="text-danger">*</span></label>
                                        <input list="areas-options" className="form-control" name="area" required value={formData.area} onChange={handleChange} placeholder="Seleccionar..." />
                                        <datalist id="areas-options"><option value="Energía" /><option value="Tecnología" /><option value="Medio Ambiente" /><option value="Educación" /></datalist>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label fw-bold small text-secondary">Estado <span className="text-danger">*</span></label>
                                        <input list="status-options" className="form-control" name="status" required value={formData.status} onChange={handleChange} placeholder="Seleccionar..." />
                                        <datalist id="status-options"><option value="En curso" /><option value="Finalizado" /><option value="En planificación" /></datalist>
                                    </div>
                                </div>

                                <div className="row g-2">
                                    <div className="col-6">
                                        <label className="form-label fw-bold small text-secondary">Inicio <span className="text-danger">*</span></label>
                                        <input type="date" className="form-control" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} required />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label fw-bold small text-secondary">Término</label>
                                        <input type="date" className="form-control" name="fecha_termino" value={formData.fecha_termino} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold small text-secondary">Resumen Corto (Tarjeta)</label>
                            <textarea className="form-control small" name="resumen" rows="2" maxLength={150} value={formData.resumen} onChange={handleChange} placeholder="Máx 150 caracteres..." />
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small text-secondary">Descripción Detallada <span className="text-danger">*</span></label>
                            <div className="border rounded bg-light overflow-hidden">
                                <Suspense fallback={<div className="p-3 text-center">Cargando editor...</div>}>
                                    <Editor value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} containerProps={{ style: { minHeight: '200px' } }} />
                                </Suspense>
                            </div>
                        </div>

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

                        <div className="d-flex gap-2">
                            <button type="submit" className="btn w-100 fw-bold text-white shadow-sm" style={{ backgroundColor: idEdicion ? '#0056b3' : '#0d6efd' }} disabled={subiendoGlobal}>
                                {subiendoGlobal ? 'Subiendo...' : (idEdicion ? 'Guardar Cambios' : 'Crear Proyecto')}
                            </button>
                            {idEdicion && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancelar</button>}
                        </div>
                    </form>
                </div>

                {/* COLUMNA DERECHA: HISTORIAL */}
                <div className="col-lg-4 d-flex flex-column">
                    <div className="card shadow-sm border-0 bg-white h-100 d-flex flex-column" style={{ minHeight: '0' }}>

                        {/* --- HEADER UNIFICADO --- */}
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 fw-bold text-secondary">Historial ({listaProyectos.length})</h6>
                        </div>

                        {/* --- BODY CON SCROLL --- */}
                        <div className="card-body p-0 overflow-auto" style={{ maxHeight: '600px' }}>
                            <div className="list-group list-group-flush shadow-sm">
                                {listaProyectos.map(p => (
                                    <div
                                        key={p.id}
                                        // Lógica de iluminado azul mantenida
                                        className={`list-group-item d-flex gap-3 align-items-center p-3 transition-all ${idEdicion === p.id ? 'bg-primary bg-opacity-10 border-primary' : ''}`}
                                        style={idEdicion === p.id ? { borderLeft: '4px solid #0d6efd' } : {}}
                                    >
                                        {/* Imagen (Mantiene tamaño original de proyectos 80x50) */}
                                        <div style={{ width: '80px', height: '50px' }} className="rounded overflow-hidden bg-light flex-shrink-0">
                                            {p.image_url ? <img src={p.image_url} className="w-100 h-100 object-fit-cover" alt="" /> : null}
                                        </div>

                                        {/* Textos */}
                                        <div className="flex-grow-1">
                                            <h6 className={`mb-0 fw-bold ${idEdicion === p.id ? 'text-primary' : ''}`}>{p.title}</h6>
                                            <small className="text-muted">{p.fecha_inicio}</small>
                                        </div>

                                        {/* Botones Unificados */}
                                        <div className="d-flex gap-1">
                                            <button
                                                onClick={() => cargarDatosParaEditar(p)}
                                                className="btn btn-sm btn-light text-primary me-1"
                                                title="Editar"
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                className="btn btn-sm btn-light text-danger"
                                                title="Eliminar"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {listaProyectos.length === 0 && (
                                    <div className="text-center p-5 text-muted small">No hay proyectos registrados.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}