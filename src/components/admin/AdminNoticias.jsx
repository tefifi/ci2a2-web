import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminNoticias.module.css';

const Editor = lazy(() => import('react-simple-wysiwyg').then(module => ({ default: module.default || module })));

/**
 * Componente UploadZone
 * Permite carga de imágenes con ajuste de punto focal para banners.
 */
const UploadZone = ({ image, onUpload, onRemove, subiendo, position, onPositionChange, required }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const sliderValue = typeof position === 'number' ? position : 50;

    return (
        <div className="h-100 d-flex flex-column">
            <label className="form-label fw-bold small text-secondary">
                Imagen Portada (Vista Previa Banner) {required && <span className="text-danger">*</span>}
            </label>
            
            <div 
                className={`flex-grow-1 position-relative rounded-3 d-flex flex-column align-items-center justify-content-center text-center transition-all overflow-hidden border ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-light'}`} 
                style={{ 
                    width: '100%',
                    aspectRatio: '2.5/1', 
                    borderStyle: image ? 'solid' : 'dashed', 
                    cursor: image ? 'default' : 'pointer', 
                    borderColor: isDragging ? '#003767' : '#dee2e6' 
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
                        <img 
                            src={image} 
                            className="w-100 h-100" 
                            style={{ objectFit: 'cover', objectPosition: `center ${sliderValue}%` }} 
                            alt="Previsualización" 
                        />
                        <div className="position-absolute top-0 end-0 m-2">
                             <button type="button" className="btn btn-danger btn-sm shadow" onClick={(e) => { e.stopPropagation(); onRemove(); }}><i className="bi bi-trash"></i></button>
                        </div>
                        {onPositionChange && (
                            <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-75 p-2 px-3" onClick={(e) => e.stopPropagation()}>
                                <div className="d-flex justify-content-between align-items-center text-white small fw-bold mb-1">
                                    <span style={{fontSize: '0.75rem'}}>Ajuste Vertical</span> 
                                    <span style={{fontSize: '0.75rem'}}>{sliderValue}%</span>
                                </div>
                                <input type="range" className="form-range form-range-sm" min="0" max="100" step="1" value={sliderValue} onChange={(e) => onPositionChange(parseInt(e.target.value))} />
                            </div>
                        )}
                    </div> 
                ) : ( 
                    <div className="text-muted pe-none p-3">
                        <i className="bi bi-card-image display-4 mb-2 opacity-50"></i>
                        <p className="small fw-bold mb-0 text-dark">Arrastrar o Click para subir</p>
                    </div> 
                )}
            </div>
        </div>
    );
};

export default function AdminNoticias() {
    const [listaNoticias, setListaNoticias] = useState([]);
    const [formData, setFormData] = useState({ titulo: '', bajada: '', cuerpo: '', fecha: '', image_url: '', image_position: 50 });
    const [isEditing, setIsEditing] = useState(false);
    const [subiendo, setSubiendo] = useState(false);

    useEffect(() => {
        fetchNoticias();
    }, []);

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
        } catch (e) {
            console.error(e);
            alert("Error al subir imagen");
        } finally {
            setSubiendo(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...formData };
        if (isEditing) {
            await supabase.from('noticias').update(payload).eq('id', isEditing);
        } else {
            await supabase.from('noticias').insert([payload]);
        }
        setFormData({ titulo: '', bajada: '', cuerpo: '', fecha: '', image_url: '', image_position: 50 });
        setIsEditing(false);
        fetchNoticias();
    };

    const handleDelete = async (id) => {
        if(!confirm("¿Eliminar esta noticia?")) return;
        await supabase.from('noticias').delete().eq('id', id);
        fetchNoticias();
    };

    const cargarEdicion = (item) => {
        setFormData(item);
        setIsEditing(item.id);
    };

    return (
        <div className={styles.contenedor}>
            <h4 className="mb-4 text-primary fw-bold">Editor de Noticias</h4>
            
            <div className="row g-4">
                {/* Formulario */}
                <div className="col-lg-5">
                    <form onSubmit={handleSubmit} className="card p-3 shadow-sm border-0 h-100">
                        <div className="mb-3" style={{height: '200px'}}>
                            <UploadZone 
                                image={formData.image_url} 
                                onUpload={handleUpload} 
                                onRemove={() => setFormData({...formData, image_url: ''})}
                                subiendo={subiendo}
                                position={formData.image_position}
                                onPositionChange={(val) => setFormData({...formData, image_position: val})}
                                required
                            />
                        </div>
                        <input className="form-control mb-2 fw-bold" placeholder="Título de la noticia" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} required />
                        <textarea className="form-control mb-2 small" placeholder="Bajada corta (resumen)" rows="2" value={formData.bajada} onChange={e => setFormData({...formData, bajada: e.target.value})} />
                        <input type="date" className="form-control mb-3" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} required />
                        
                        <div className="flex-grow-1 border rounded bg-light mb-3">
                            <Suspense fallback="Cargando editor...">
                                <Editor value={formData.cuerpo} onChange={e => setFormData({...formData, cuerpo: e.target.value})} containerProps={{ style: { height: '100%', minHeight:'200px' } }} />
                            </Suspense>
                        </div>
                        
                        <div className="d-flex gap-2">
                            <button type="submit" className={`btn w-100 ${isEditing ? 'btn-warning' : 'btn-primary'}`}>
                                {isEditing ? 'Guardar Cambios' : 'Publicar Noticia'}
                            </button>
                            {isEditing && <button type="button" className="btn btn-outline-secondary" onClick={() => {setIsEditing(false); setFormData({ titulo: '', bajada: '', cuerpo: '', fecha: '', image_url: '', image_position: 50 });}}>Cancelar</button>}
                        </div>
                    </form>
                </div>

                {/* Lista */}
                <div className="col-lg-7">
                    <div className="list-group shadow-sm">
                        {listaNoticias.map(n => (
                            <div key={n.id} className="list-group-item d-flex gap-3 align-items-center p-3">
                                <div style={{width: '80px', height: '50px'}} className="rounded overflow-hidden bg-light flex-shrink-0">
                                    {n.image_url ? <img src={n.image_url} className="w-100 h-100 object-fit-cover" alt="" /> : null}
                                </div>
                                <div className="flex-grow-1">
                                    <h6 className="mb-0 fw-bold">{n.titulo}</h6>
                                    <small className="text-muted">{n.fecha}</small>
                                </div>
                                <div>
                                    <button onClick={() => cargarEdicion(n)} className="btn btn-sm btn-light text-primary me-1"><i className="bi bi-pencil"></i></button>
                                    <button onClick={() => handleDelete(n.id)} className="btn btn-sm btn-light text-danger"><i className="bi bi-trash"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}