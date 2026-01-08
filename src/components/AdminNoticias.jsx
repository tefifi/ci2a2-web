import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { supabase, uploadImage } from '../lib/supabase';
import styles from './AdminNoticias.module.css';

const Editor = lazy(() => import('react-simple-wysiwyg').then(module => ({ default: module.default || module })));

// --- ZONA DE CARGA TIPO BANNER REALISTA ---
const UploadZone = ({ image, onUpload, onRemove, subiendo, position, onPositionChange, required }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const sliderValue = typeof position === 'number' ? position : 50;

    return (
        <div className="h-100 d-flex flex-column">
            <label className="form-label fw-bold small text-secondary">
                Imagen Portada (Vista Previa Banner) {required && <span className="text-danger">*</span>}
            </label>
            
            {/* AQUÍ ESTÁ LA MAGIA: 
               aspectRatio: '2.5/1' simula el banner ancho de la web.
               Así verás el recorte real.
            */}
            <div 
                className={`flex-grow-1 position-relative rounded-3 d-flex flex-column align-items-center justify-content-center text-center transition-all overflow-hidden border ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-light'}`} 
                style={{ 
                    width: '100%',
                    aspectRatio: '2.5/1', // <--- FORMA DE BANNER
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
                        {/* IMAGEN CON EL MISMO AJUSTE QUE LA WEB */}
                        <img 
                            src={image} 
                            className="w-100 h-100" 
                            style={{ objectFit: 'cover', objectPosition: `center ${sliderValue}%` }} 
                            alt="Previsualización" 
                        />
                        
                        <div className="position-absolute top-0 end-0 m-2">
                             <button type="button" className="btn btn-danger btn-sm shadow" onClick={(e) => { e.stopPropagation(); onRemove(); }}><i className="bi bi-trash"></i></button>
                        </div>
                        
                        {/* SLIDER SEMI-TRANSPARENTE ABAJO */}
                        {onPositionChange && (
                            <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-75 p-2 px-3" onClick={(e) => e.stopPropagation()}>
                                <div className="d-flex justify-content-between align-items-center text-white small fw-bold mb-1">
                                    <span style={{fontSize: '0.75rem'}}>Mover Imagen (Vertical)</span> 
                                    <span style={{fontSize: '0.75rem'}}>{sliderValue}%</span>
                                </div>
                                <input type="range" className="form-range form-range-sm" min="0" max="100" step="1" value={sliderValue} onChange={(e) => onPositionChange(parseInt(e.target.value))} />
                            </div>
                        )}
                    </div> 
                ) : ( 
                    <div className="text-muted pe-none p-3">
                        <i className="bi bi-card-image display-4 mb-2 opacity-50"></i>
                        <p className="small fw-bold mb-0 text-dark">Subir Banner</p>
                        <span className="small text-secondary" style={{fontSize:'0.75rem'}}>Formato panorámico recomendado</span>
                    </div> 
                )}
            </div>
        </div>
    );
};

export default function AdminNoticias() {
    const [listaNoticias, setListaNoticias] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const [subiendo, setSubiendo] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    const [listaAutores, setListaAutores] = useState(['']);

    const [formData, setFormData] = useState({
        titulo: '', bajada: '', cuerpo: '', fecha: '',
        categoria: '', image_url: '', image_position: 50
    });

    useEffect(() => { fetchNoticias(); }, []);

    const fetchNoticias = async () => {
        try { 
            const { data, error } = await supabase.from('noticias').select('*').order('fecha', { ascending: false });
            if (error) throw error; 
            if (data) setListaNoticias(data); 
        } catch (error) { console.error(error); }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleAutorChange = (index, valor) => {
        const nuevosAutores = [...listaAutores];
        nuevosAutores[index] = valor;
        setListaAutores(nuevosAutores);
    };
    const agregarAutor = () => setListaAutores([...listaAutores, '']);
    const eliminarAutor = (index) => {
        const nuevosAutores = listaAutores.filter((_, i) => i !== index);
        setListaAutores(nuevosAutores.length ? nuevosAutores : ['']); 
    };

    const handleUpload = async (file) => { 
        try { setSubiendo(true); const url = await uploadImage(file); setFormData(prev => ({ ...prev, image_url: url })); } 
        catch (error) { alert(error.message); } finally { setSubiendo(false); } 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const autoresString = listaAutores.filter(a => a.trim() !== '').join(', ');
        const datosEnvio = { ...formData, autor: autoresString, image_position: formData.image_position || 50 };

        try {
            if (idEdicion) { 
                const { error } = await supabase.from('noticias').update(datosEnvio).eq('id', idEdicion); 
                if (error) throw error; 
                setMensaje({ tipo: 'success', texto: 'Noticia actualizada correctamente' }); 
            } else { 
                const { error } = await supabase.from('noticias').insert([datosEnvio]); 
                if (error) throw error; 
                setMensaje({ tipo: 'success', texto: 'Noticia creada correctamente' }); 
            }
            setFormData({ titulo: '', bajada: '', cuerpo: '', fecha: '', categoria: '', image_url: '', image_position: 50 });
            setListaAutores(['']);
            setIdEdicion(null); 
            fetchNoticias(); 
            document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) { setMensaje({ tipo: 'danger', texto: error.message }); }
    };

    const cargarDatosParaEditar = (n) => { 
        let pos = typeof n.image_position === 'number' ? n.image_position : 50;
        const autoresArray = n.autor ? n.autor.split(',').map(a => a.trim()) : [''];
        setFormData({ ...n, image_position: pos }); 
        setListaAutores(autoresArray); 
        setIdEdicion(n.id); 
        document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' }); 
    };

    const handleDelete = async (id) => { 
        if (confirm('¿Eliminar esta noticia?')) { 
            const { error } = await supabase.from('noticias').delete().eq('id', id); 
            if (!error) fetchNoticias(); 
        } 
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4 fw-bold" style={{ color: '#003767' }}>Gestión de Noticias</h2>
            
            {mensaje && (
                <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show`}>
                    {mensaje.texto} <button className="btn-close" onClick={() => setMensaje(null)}></button>
                </div>
            )}

            <div className="row g-4 align-items-stretch">
                
                {/* COLUMNA IZQUIERDA: FORMULARIO */}
                <div className="col-lg-8">
                    <div className={`card shadow-sm border-0 ${styles.contenedor}`} id="form-top">
                        <div className="card-body p-4">
                            <h5 className="card-title mb-4 fw-bold text-dark border-bottom pb-2">
                                <i className={`bi ${idEdicion ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{color: '#003767'}}></i>
                                {idEdicion ? 'Editar Noticia' : 'Nueva Noticia'}
                            </h5>
                            
                            <form onSubmit={handleSubmit}>
                                {/* --- ZONA SUPERIOR DIVIDIDA --- */}
                                <div className="row mb-4">
                                    {/* COLUMNA IMAGEN (IZQUIERDA) - AHORA MÁS ANCHA EN MÓVIL */}
                                    <div className="col-12 mb-4">
                                        <UploadZone 
                                            image={formData.image_url} 
                                            onUpload={handleUpload} 
                                            onRemove={() => setFormData(prev => ({ ...prev, image_url: '' }))} 
                                            subiendo={subiendo}
                                            position={formData.image_position}
                                            onPositionChange={(pos) => setFormData(prev => ({...prev, image_position: pos}))}
                                            required={true} 
                                        />
                                    </div>

                                    {/* COLUMNA DATOS (AHORA ABAJO DEL BANNER) */}
                                    <div className="col-12">
                                        <div className="row g-3">
                                            <div className="col-md-8">
                                                <label className="fw-bold small mb-1 text-secondary">Título <span className="text-danger">*</span></label>
                                                <input type="text" className="form-control" name="titulo" required value={formData.titulo} onChange={handleChange} placeholder="Titular de la noticia" />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="fw-bold small mb-1 text-secondary">Fecha <span className="text-danger">*</span></label>
                                                <input type="date" className="form-control" name="fecha" required value={formData.fecha} onChange={handleChange} />
                                            </div>
                                            
                                            <div className="col-md-6">
                                                <label className="fw-bold small mb-1 text-secondary">Categoría <span className="text-danger">*</span></label>
                                                <input list="categorias-options" className="form-control" name="categoria" required value={formData.categoria} onChange={handleChange} placeholder="Seleccionar..." />
                                                <datalist id="categorias-options">
                                                    <option value="Investigación" /><option value="Evento" /><option value="Comunicado" /><option value="Prensa" /><option value="Vinculación" />
                                                </datalist>
                                            </div>
                                            
                                            <div className="col-md-6">
                                                {/* Autores Compacto */}
                                                <label className="fw-bold text-dark small mb-1">Autores</label>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {listaAutores.map((autor, index) => (
                                                        <div key={index} className="input-group input-group-sm" style={{width: '100%'}}>
                                                            <input type="text" className="form-control" placeholder="Nombre Autor" value={autor} onChange={(e) => handleAutorChange(index, e.target.value)} />
                                                            <button className="btn btn-outline-secondary" type="button" onClick={index === 0 && listaAutores.length === 1 ? agregarAutor : () => eliminarAutor(index)}>
                                                                {index === 0 && listaAutores.length === 1 ? '+' : '×'}
                                                            </button>
                                                            {index === listaAutores.length - 1 && index !== 0 && (
                                                                <button className="btn btn-outline-primary" type="button" onClick={agregarAutor}>+</button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <label className="fw-bold small mb-1 text-secondary">Bajada</label>
                                                <textarea className="form-control" name="bajada" rows="2" value={formData.bajada} onChange={handleChange} placeholder="Breve introducción..." />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* --- FIN ZONA SUPERIOR --- */}

                                <div className="mb-4">
                                    <label className="fw-bold small mb-2 text-secondary">Cuerpo de la Noticia <span className="text-danger">*</span></label>
                                    <div className="shadow-sm bg-white border rounded overflow-hidden" style={{ minHeight: '300px' }}>
                                        <Suspense fallback={<div className="p-3 text-center">Cargando editor...</div>}>
                                            <Editor value={formData.cuerpo} onChange={(e) => setFormData({...formData, cuerpo: e.target.value})} containerProps={{ style: { height: '350px' } }} />
                                        </Suspense>
                                    </div>
                                </div>

                                <div className="d-grid gap-2 d-md-flex">
                                    <button type="submit" className="btn fw-bold py-2 px-5 text-white flex-grow-1" style={{ backgroundColor: '#003767' }} disabled={subiendo}>
                                        {subiendo ? 'Subiendo...' : (idEdicion ? 'Guardar Cambios' : 'Publicar Noticia')}
                                    </button>
                                    {idEdicion && <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setIdEdicion(null); setFormData({ titulo: '', bajada: '', cuerpo: '', fecha: '', categoria: '', image_url: '', image_position: 50 }); setListaAutores(['']); }}>Cancelar</button>}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: LISTADO */}
                <div className="col-lg-4 d-flex flex-column">
                    <div className="card shadow-sm border-0 bg-white h-100 d-flex flex-column" style={{minHeight: '0'}}> 
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold text-secondary">Historial ({listaNoticias.length})</h5>
                        </div>
                        <div className="list-group list-group-flush flex-grow-1 overflow-y-auto" style={{ minHeight: '0' }}>
                            {listaNoticias.map(n => {
                                const isEditing = idEdicion === n.id;
                                return (
                                    <div key={n.id} className={`list-group-item p-3 border-0 border-bottom d-flex align-items-start gap-3 ${isEditing ? 'bg-primary-subtle border-start border-4 border-primary' : ''}`}>
                                        {/* MINIATURA: MANTIENE ASPECTO BANNER PARA RECONOCERLA */}
                                        <div className="bg-light rounded d-flex align-items-center justify-content-center border overflow-hidden" style={{width:'80px', height:'35px', flexShrink:0}}>
                                            {n.image_url ? (
                                                <img src={n.image_url} className="w-100 h-100" style={{ objectFit: 'cover', objectPosition: `center ${n.image_position || 50}%` }} alt="" />
                                            ) : <i className="bi bi-image text-muted"></i>}
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className={`mb-1 fw-bold small ${isEditing ? 'text-primary' : 'text-dark'}`}>{n.titulo}</h6>
                                            <div className="small text-muted">{n.fecha}</div>
                                        </div>
                                        <div className="d-flex flex-column gap-1">
                                            <button onClick={() => cargarDatosParaEditar(n)} className={`btn btn-sm ${isEditing ? 'btn-primary' : 'btn-outline-light text-secondary border'}`}><i className="bi bi-pencil"></i></button>
                                            <button onClick={() => handleDelete(n.id)} className="btn btn-sm btn-outline-light text-danger border"><i className="bi bi-trash"></i></button>
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