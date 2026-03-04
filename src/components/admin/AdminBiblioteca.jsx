import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useConfirmar, ModalConfirmar } from './components/AdminUI';

const UploadZoneUnified = ({ imageUploaded, youtubeUrl, resourceType, onUpload, onRemove, subiendo }) => {
    const [isDragging, setIsDragging] = useState(false);
    const getYoutubeThumb = () => {
        if (resourceType !== 'video' || !youtubeUrl) return null;
        const match = youtubeUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg` : null;
    };
    const imageToShow = imageUploaded || getYoutubeThumb();
    const isShowingYoutubeAuto = !imageUploaded && getYoutubeThumb();
    return (
        <div className="d-flex flex-column h-100" tabIndex="0" style={{ outline: 'none' }}>
            <label className="form-label fw-bold small text-secondary">Miniatura (16:9)</label>
            <div className={`position-relative rounded-3 overflow-hidden border flex-grow-1 d-flex align-items-center justify-content-center ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
                style={{ width: '100%', minHeight: '140px', aspectRatio: '16/9', cursor: 'pointer', borderStyle: imageToShow ? 'solid' : 'dashed', borderColor: isDragging ? 'var(--bs-primary)' : '#dee2e6' }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) onUpload(f); }}
                onClick={() => document.getElementById('file-upload-biblio').click()}>
                {subiendo ? (
                    <div className="d-flex w-100 h-100 align-items-center justify-content-center flex-column text-muted">
                        <div className="spinner-border spinner-border-sm mb-2 text-primary"></div><small>Subiendo...</small>
                    </div>
                ) : imageToShow ? (
                    <div className="position-relative w-100 h-100">
                        <img src={imageToShow} alt="Preview" className="w-100 h-100 object-fit-cover" />
                        {!isShowingYoutubeAuto && (
                            <div className="position-absolute top-0 end-0 p-2">
                                <button type="button" className="btn btn-danger shadow d-flex align-items-center justify-content-center"
                                    style={{ width: '32px', height: '32px', borderRadius: '6px' }}
                                    onClick={(e) => { e.stopPropagation(); onRemove(); }}>
                                    <i className="bi bi-trash-fill" style={{ fontSize: '1rem' }}></i>
                                </button>
                            </div>
                        )}
                        {isShowingYoutubeAuto && (
                            <div className="position-absolute bottom-0 start-0 m-2">
                                <span className="badge bg-danger bg-opacity-90 text-white fw-normal shadow-sm" style={{ fontSize: '0.65rem' }}>
                                    <i className="bi bi-youtube me-1"></i> YouTube Auto
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center text-muted p-3 opacity-75 text-center">
                        <i className="bi bi-image fs-4 mb-1 opacity-50"></i>
                        <small className="fw-bold" style={{ fontSize: '0.75rem' }}>Subir imagen</small>
                    </div>
                )}
                <input type="file" id="file-upload-biblio" className="d-none" accept="image/*" onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />
            </div>
        </div>
    );
};

const PdfUploadZone = ({ pdfUrl, onUpload, onRemove, subiendo }) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef(null);
    const nombreArchivo = pdfUrl ? decodeURIComponent(pdfUrl.split('/').pop().split('?')[0]) : null;
    return (
        <div className="mb-2">
            <label className="form-label fw-bold small text-secondary">Archivo PDF <span className="text-danger">*</span></label>
            {pdfUrl ? (
                <div className="d-flex align-items-center gap-2 p-3 rounded-3 border bg-light">
                    <i className="bi bi-file-earmark-pdf-fill text-danger fs-4 flex-shrink-0"></i>
                    <div className="flex-grow-1 overflow-hidden">
                        <p className="mb-0 fw-bold small text-dark text-truncate">{nombreArchivo}</p>
                        <a href={pdfUrl} target="_blank" rel="noreferrer" className="small text-primary text-decoration-none">
                            <i className="bi bi-box-arrow-up-right me-1"></i>Ver PDF
                        </a>
                    </div>
                    <div className="d-flex gap-1 flex-shrink-0">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => inputRef.current?.click()}><i className="bi bi-arrow-repeat"></i></button>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRemove}><i className="bi bi-trash"></i></button>
                    </div>
                </div>
            ) : (
                <div className={`rounded-3 border d-flex flex-column align-items-center justify-content-center p-4 text-center ${isDragging ? 'border-danger bg-danger bg-opacity-10' : 'bg-light'}`}
                    style={{ borderStyle: 'dashed', cursor: 'pointer', minHeight: '110px' }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') onUpload(f); }}
                    onClick={() => inputRef.current?.click()}>
                    {subiendo
                        ? <><div className="spinner-border spinner-border-sm text-danger mb-2"></div><small className="text-muted fw-bold">Subiendo PDF...</small></>
                        : <><i className="bi bi-file-earmark-arrow-up fs-3 mb-2 text-muted opacity-50"></i>
                           <small className="fw-bold text-muted">Arrastra o haz clic para subir PDF</small>
                           <small className="text-muted opacity-75" style={{ fontSize: '0.7rem' }}>Solo archivos .pdf</small></>
                    }
                </div>
            )}
            <input type="file" ref={inputRef} className="d-none" accept="application/pdf"
                onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />
        </div>
    );
};

export default function AdminBiblioteca({ token }) {
    const [lista, setLista]             = useState([]);
    const [loading, setLoading]         = useState(false);
    const [subiendo, setSubiendo]       = useState(false);
    const [subiendoPdf, setSubiendoPdf] = useState(false);
    const [mensaje, setMensaje]         = useState(null);
    const [idEdicion, setIdEdicion]     = useState(null);
    const [sessionReady, setSessionReady] = useState(false);
    const { confirmar, modalProps }     = useConfirmar();
    const [form, setForm] = useState({ titulo: '', descripcion: '', url: '', imagen_url: '', tipo: 'link', autor: '', destacado: false });

    useEffect(() => {
        const init = async () => {
            if (token) await supabase.auth.setSession({ access_token: token, refresh_token: token });
            setSessionReady(true);
        };
        init();
    }, [token]);

    useEffect(() => { if (sessionReady) fetchRecursos(); }, [sessionReady]);

    const fetchRecursos = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('biblioteca').select('*').order('created_at', { ascending: false });
        if (error && (error.code === 'PGRST301' || error.status === 401))
            setMensaje({ tipo: 'warning', texto: 'Sesión inestable. Recarga la página.' });
        else setLista(data || []);
        setLoading(false);
    };

    const handleImageUpload = async (file) => {
        setSubiendo(true);
        try {
            const ext = file.name.split('.').pop();
            const { error } = await supabase.storage.from('biblioteca-img').upload(`biblio_${Date.now()}.${ext}`, file);
            if (error) throw error;
            const { data } = supabase.storage.from('biblioteca-img').getPublicUrl(`biblio_${Date.now()}.${ext}`);
            // Recargar con URL correcta
            const { data: d2 } = await supabase.storage.from('biblioteca-img').upload(`biblio_${Date.now()}.${ext}`, file);
            const url = supabase.storage.from('biblioteca-img').getPublicUrl(`biblio_${Date.now()}.${ext}`).data.publicUrl;
            setForm(prev => ({ ...prev, imagen_url: url }));
        } catch (err) { alert('Error al subir imagen: ' + err.message); }
        finally { setSubiendo(false); }
    };

    // Fix: upload imagen correctamente
    const handleImgUpload = async (file) => {
        if (!file) return;
        setSubiendo(true);
        try {
            const ext = file.name.split('.').pop();
            const name = `biblio_${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from('biblioteca-img').upload(name, file);
            if (error) throw error;
            const { data } = supabase.storage.from('biblioteca-img').getPublicUrl(name);
            setForm(prev => ({ ...prev, imagen_url: data.publicUrl }));
        } catch (err) { alert('Error: ' + err.message); }
        finally { setSubiendo(false); }
    };

    const handlePdfUpload = async (file) => {
        if (!file) return;
        setSubiendoPdf(true);
        try {
            const name = `pdf_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const { error } = await supabase.storage.from('biblioteca-pdfs').upload(name, file, { contentType: 'application/pdf' });
            if (error) throw error;
            const { data } = supabase.storage.from('biblioteca-pdfs').getPublicUrl(name);
            setForm(prev => ({ ...prev, url: data.publicUrl }));
        } catch (err) { alert('Error al subir PDF: ' + err.message); }
        finally { setSubiendoPdf(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje(null);
        if (!form.titulo) { setMensaje({ tipo: 'danger', texto: 'El título es obligatorio.' }); return; }
        if (!form.url)    { setMensaje({ tipo: 'danger', texto: form.tipo === 'paper' ? 'Sube un PDF o ingresa una URL.' : 'La URL es obligatoria.' }); return; }
        try {
            if (idEdicion) {
                const { error } = await supabase.from('biblioteca').update({ ...form }).eq('id', idEdicion);
                if (error) throw error;
                setMensaje({ tipo: 'success', texto: 'Recurso actualizado correctamente.' });
            } else {
                const { error } = await supabase.from('biblioteca').insert([{ ...form }]);
                if (error) throw error;
                setMensaje({ tipo: 'success', texto: 'Recurso creado con éxito.' });
            }
            resetForm(); fetchRecursos();
            document.getElementById('top-anchor')?.scrollIntoView({ behavior: 'smooth' });
        } catch (err) { setMensaje({ tipo: 'danger', texto: 'Error al guardar: ' + err.message }); }
    };

    const handleDelete = async (id) => {
        const ok = await confirmar({
            titulo: '¿Eliminar este recurso?',
            descripcion: 'Se eliminará permanentemente de la biblioteca digital.',
        });
        if (!ok) return;
        await supabase.from('biblioteca').delete().eq('id', id);
        if (idEdicion === id) resetForm();
        fetchRecursos();
    };

    const resetForm = () => {
        setForm({ titulo: '', descripcion: '', url: '', imagen_url: '', tipo: 'link', autor: '', destacado: false });
        setIdEdicion(null);
    };

    const esPaper = form.tipo === 'paper';

    return (
        <div className="container-fluid p-0 mb-5" id="top-anchor">
            <ModalConfirmar {...modalProps} />
            <ModalConfirmar {...modalProps} />
            <div className="mb-4"><h2 className="fw-bold mb-0" style={{ color: '#003767' }}>Gestión de Biblioteca</h2></div>

            {mensaje && (
                <div className={`alert alert-${mensaje.tipo} shadow-sm mb-4 border-0 d-flex align-items-center`}>
                    <i className={`bi ${mensaje.tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2 fs-5`}></i>
                    <div className="flex-grow-1 fw-medium">{mensaje.texto}</div>
                    <button type="button" className="btn-close" onClick={() => setMensaje(null)}></button>
                </div>
            )}

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold" style={{ color: '#003767' }}>
                                <i className={`bi ${idEdicion ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                                {idEdicion ? 'Editar Recurso' : 'Nuevo Recurso'}
                            </h5>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit}>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-secondary">Título <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control bg-light border-0" placeholder="Ej: Webinar sobre IA..."
                                            value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-secondary">Tipo</label>
                                        <select className="form-select bg-light border-0" value={form.tipo}
                                            onChange={e => setForm({ ...form, tipo: e.target.value, url: '' })}>
                                            <option value="link">Enlace Web</option>
                                            <option value="video">Video (YouTube)</option>
                                            <option value="centro">Centro Investigación</option>
                                            <option value="paper">Paper / PDF</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-secondary">Autor / Fuente</label>
                                        <input type="text" className="form-control bg-light border-0" placeholder="Ej: CI2A2"
                                            value={form.autor} onChange={e => setForm({ ...form, autor: e.target.value })} />
                                    </div>
                                    {esPaper ? (
                                        <div className="col-12">
                                            <PdfUploadZone pdfUrl={form.url} onUpload={handlePdfUpload}
                                                onRemove={() => setForm({ ...form, url: '' })} subiendo={subiendoPdf} />
                                            <div className="mt-2">
                                                <label className="form-label small text-secondary mb-1">O ingresa URL externa (DOI, repositorio, etc.)</label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-0 text-secondary"><i className="bi bi-link-45deg"></i></span>
                                                    <input type="url" className="form-control bg-light border-0" placeholder="https://doi.org/..."
                                                        value={form.url.startsWith('http') && !form.url.includes('supabase') ? form.url : ''}
                                                        onChange={e => setForm({ ...form, url: e.target.value })} />
                                                </div>
                                                <div className="form-text" style={{ fontSize: '0.7rem' }}>Si subes un PDF, este campo se completa automáticamente.</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="col-12">
                                            <label className="form-label fw-bold small text-secondary">Enlace / URL <span className="text-danger">*</span></label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0 text-secondary"><i className="bi bi-link-45deg"></i></span>
                                                <input type="url" className="form-control bg-light border-0" placeholder="https://..."
                                                    value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required />
                                            </div>
                                        </div>
                                    )}
                                    <div className="col-md-7 d-flex flex-column">
                                        <label className="form-label fw-bold small text-secondary">Descripción</label>
                                        <textarea className="form-control bg-light border-0 flex-grow-1" placeholder="Resumen del recurso..."
                                            value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                                            style={{ minHeight: '160px' }}></textarea>
                                    </div>
                                    <div className="col-md-5 d-flex flex-column justify-content-between">
                                        <UploadZoneUnified imageUploaded={form.imagen_url} youtubeUrl={form.url} resourceType={form.tipo}
                                            onUpload={handleImgUpload} onRemove={() => setForm({ ...form, imagen_url: '' })} subiendo={subiendo} />
                                        <div className="form-text small mt-1 text-muted text-end" style={{ fontSize: '0.7rem' }}>Formato 16:9 recomendado</div>
                                    </div>
                                    <div className="col-12">
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" id="destacado"
                                                checked={form.destacado} onChange={e => setForm({ ...form, destacado: e.target.checked })} />
                                            <label className="form-check-label small fw-bold text-secondary" htmlFor="destacado">Marcar como destacado</label>
                                        </div>
                                    </div>
                                    <div className="col-12 pt-4 border-top mt-2">
                                        {idEdicion ? (
                                            <div className="d-flex gap-2 justify-content-end">
                                              <button type="submit" className="btn text-white fw-bold shadow-sm" style={{ backgroundColor: '#003767', width: '75%' }}
                                                    disabled={loading || subiendo || subiendoPdf}>
                                                    {(subiendo || subiendoPdf) ? <><span className="spinner-border spinner-border-sm me-2"></span>Subiendo...</> : 'Guardar Cambios'}
                                                </button>
                                                <button type="button" className="btn btn-secondary fw-bold" style={{ width: '25%' }}
                                                    onClick={() => { resetForm(); setMensaje(null); }}>Cancelar</button>
                                                
                                            </div>
                                        ) : (
                                            <button type="submit" className="btn w-100 text-white fw-bold shadow-sm py-2" style={{ backgroundColor: '#003767' }}
                                                disabled={loading || subiendo || subiendoPdf}>
                                                {(subiendo || subiendoPdf) ? <><span className="spinner-border spinner-border-sm me-2"></span>Subiendo...</> : 'Crear Recurso'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                        <div className="card-header bg-light border-bottom py-3">
                            <h6 className="fw-bold text-secondary mb-0">Publicados ({lista.length})</h6>
                        </div>
                        <div className="card-body p-3 overflow-auto" style={{ maxHeight: '800px' }}>
                            <div className="d-flex flex-column gap-3">
                                {lista.map((item) => {
                                    const ytMatch = item.tipo === 'video' && item.url ? item.url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/) : null;
                                    const thumb = item.imagen_url || (ytMatch && ytMatch[2].length === 11 ? `https://img.youtube.com/vi/${ytMatch[2]}/default.jpg` : null);
                                    return (
                                        <div key={item.id}
                                            className={`d-flex align-items-center border rounded p-2 shadow-sm ${idEdicion === item.id ? 'bg-primary-subtle' : 'bg-white'}`}
                                            style={idEdicion === item.id ? { borderLeft: '4px solid #003767' } : {}}>
                                            <div style={{ width: '80px', height: '50px' }} className="rounded overflow-hidden bg-light flex-shrink-0 d-flex align-items-center justify-content-center border">
                                                {item.tipo === 'paper' && !thumb ? <i className="bi bi-file-earmark-pdf-fill text-danger fs-4"></i>
                                                    : thumb ? <img src={thumb} className="w-100 h-100 object-fit-cover" alt="" />
                                                    : <i className="bi bi-link-45deg text-muted opacity-50"></i>}
                                            </div>
                                            <div className="flex-grow-1 px-3 overflow-hidden">
                                                <h6 className={`mb-0 fw-bold text-truncate ${idEdicion === item.id ? 'text-primary' : 'text-dark'}`} style={{ fontSize: '0.9rem' }}>{item.titulo}</h6>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="badge bg-light text-secondary border fw-normal" style={{ fontSize: '0.65rem' }}>
                                                        {item.tipo === 'paper' ? '📄 PDF' : item.tipo.toUpperCase()}
                                                    </span>
                                                    {item.autor && <small className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{item.autor}</small>}
                                                </div>
                                            </div>
                                            <div className="d-flex gap-1">
                                                <button onClick={() => { setForm(item); setIdEdicion(item.id); setMensaje(null); document.getElementById('top-anchor')?.scrollIntoView({ behavior: 'smooth' }); }}
                                                    className="btn btn-sm btn-light text-primary border-0" title="Editar"><i className="bi bi-pencil"></i></button>
                                                <button onClick={() => handleDelete(item.id)}
                                                    className="btn btn-sm btn-light text-danger border-0" title="Eliminar"><i className="bi bi-trash"></i></button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {lista.length === 0 && !loading && (
                                    <div className="text-center py-5 text-muted small opacity-50">
                                        <i className="bi bi-inbox fs-2 d-block mb-2"></i>No hay recursos publicados.
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