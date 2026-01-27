import React, { useState, useEffect, useRef, useMemo, lazy } from 'react';
import { supabase } from '../../lib/supabase';

// --- COMPONENTE UPLOAD (Tu versión original) ---
const UploadZone = ({ image, onUpload, onRemove, subiendo, required }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e, status) => {
        e.preventDefault();
        setIsDragging(status);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith('image/')) onUpload(file);
    };

    return (
        <div className="d-flex flex-column h-100">
            <label className="form-label fw-bold small text-secondary">
                Logo (Cuadrado) {required && <span className="text-danger">*</span>}
            </label>
            
            <div
                className={`position-relative rounded-3 overflow-hidden border transition-all ${isDragging ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
                style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    cursor: image ? 'default' : 'pointer',
                    borderStyle: image ? 'solid' : 'dashed',
                    borderWidth: '2px',
                    borderColor: isDragging ? '#003767' : '#dee2e6',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
                onDragOver={(e) => handleDrag(e, true)}
                onDragLeave={(e) => handleDrag(e, false)}
                onDrop={handleDrop}
                onClick={() => !image && fileInputRef.current.click()}
            >
                <input type="file" hidden ref={fileInputRef} onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} accept="image/*" />

                {subiendo ? (
                    <div className="text-primary text-center">
                        <div className="spinner-border spinner-border-sm mb-2"></div>
                        <p className="small fw-bold mb-0">Subiendo...</p>
                    </div>
                ) : image ? (
                    <div className="w-100 h-100 position-relative group-hover">
                        <img src={image} className="w-100 h-100 object-fit-contain p-2 bg-white" alt="Logo Preview" />
                        <button
                            type="button"
                            className="btn btn-danger position-absolute top-0 end-0 m-2 shadow-sm d-flex align-items-center justify-content-center"
                            style={{ width: '28px', height: '28px' }}
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            title="Eliminar logo"
                        >
                            <i className="bi bi-trash small"></i>
                        </button>
                    </div>
                ) : (
                    <div className="text-muted p-3 text-center w-100">
                        <i className={`bi ${isDragging ? 'bi-cloud-upload-fill text-primary' : 'bi-image'} fs-1 mb-2 opacity-50`}></i>
                        <p className="small fw-bold mb-0">Arrastrar Logo</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function AdminAlianzas() {
    const [listaAlianzas, setListaAlianzas] = useState([]);
    const [subiendo, setSubiendo] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    const [mensaje, setMensaje] = useState(null);

    // 1. AQUI AGREGAMOS LA FECHA AL ESTADO
    const [formData, setFormData] = useState({
        nombre: '',
        tipo_entidad: '',
        estado_convenio: '',
        pais: '',
        link_web: '',
        logo_url: '',
        fecha_firma: '' // <--- NUEVO CAMPO
    });

    useEffect(() => { fetchAlianzas(); }, []);

    useEffect(() => {
        if (mensaje) {
            const timer = setTimeout(() => setMensaje(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    const sugerencias = useMemo(() => {
        const tipos = new Set(['Clientes', 'Alianzas', 'Ecosistema', 'Universidades Socias']);
        const estados = new Set(['Acuerdo de Cooperación', 'Contrato de Servicios']);
        const paises = new Set(['Chile', 'Perú', 'México', 'Estados Unidos', 'España', 'China']);

        listaAlianzas.forEach(a => {
            if (a.tipo_entidad) tipos.add(a.tipo_entidad);
            if (a.estado_convenio) estados.add(a.estado_convenio);
            if (a.pais) paises.add(a.pais);
        });

        return { 
            tipos: Array.from(tipos).sort(), 
            estados: Array.from(estados).sort(),
            paises: Array.from(paises).sort()
        };
    }, [listaAlianzas]);

    const fetchAlianzas = async () => {
        const { data } = await supabase.from('alianzas').select('*').order('nombre', { ascending: true });
        if (data) setListaAlianzas(data);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUploadLogo = async (file) => {
        setSubiendo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${Date.now()}.${fileExt}`;
            const { error } = await supabase.storage.from('contrapartes').upload(fileName, file);
            if (error) throw error;
            const { data } = supabase.storage.from('contrapartes').getPublicUrl(fileName);
            setFormData(prev => ({ ...prev, logo_url: data.publicUrl }));
        } catch (error) {
            setMensaje({ tipo: 'danger', texto: "Error al subir el logo." });
        } finally {
            setSubiendo(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nombre) {
            setMensaje({ tipo: 'warning', texto: 'El nombre de la alianza es obligatorio.' });
            return;
        }

        try {
            if (idEdicion) {
                const { error } = await supabase.from('alianzas').update(formData).eq('id', idEdicion);
                if (error) throw error;
                setMensaje({ tipo: 'success', texto: 'Registro actualizado correctamente.' });
            } else {
                const { error } = await supabase.from('alianzas').insert([formData]);
                if (error) throw error;
                setMensaje({ tipo: 'success', texto: 'Registro creado exitosamente.' });
            }
            resetForm();
            fetchAlianzas();
            document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error(error);
            setMensaje({ tipo: 'danger', texto: 'Error al guardar: ' + error.message });
        }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar este registro?')) {
            const { error } = await supabase.from('alianzas').delete().eq('id', id);
            if (!error) {
                fetchAlianzas();
                if (idEdicion === id) resetForm();
            }
        }
    };

    const cargarEdicion = (item) => {
        setFormData({
            nombre: item.nombre || '',
            tipo_entidad: item.tipo_entidad || '',
            estado_convenio: item.estado_convenio || '',
            pais: item.pais || '',
            link_web: item.link_web || '',
            logo_url: item.logo_url || '',
            fecha_firma: item.fecha_firma || '' // <--- CARGAMOS LA FECHA
        });
        setIdEdicion(item.id);
        document.getElementById('form-top')?.scrollIntoView({ behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({
            nombre: '', tipo_entidad: '', estado_convenio: '', pais: '',
            link_web: '', logo_url: '', fecha_firma: ''
        });
        setIdEdicion(null);
    };

    return (
        <div className="container-fluid p-0">
            <h2 className="mb-4 fw-bold" style={{ color: '#003767' }}>Gestión de Alianzas y Clientes</h2>

            {mensaje && (
                <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show mb-4 shadow-sm border-0`}>
                    <i className={`bi ${mensaje.tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    {mensaje.texto}
                    <button type="button" className="btn-close" onClick={() => setMensaje(null)}></button>
                </div>
            )}

            <div className="row g-4">
                
                {/* --- IZQUIERDA: FORMULARIO --- */}
                <div className="col-lg-8">
                    <form onSubmit={handleSubmit} className="card p-4 shadow-sm border-0 h-100" id="form-top">
                        
                        <h5 className="card-title mb-4 fw-bold text-dark border-bottom pb-2">
                            <i className={`bi ${idEdicion ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: '#003767' }}></i>
                            {idEdicion ? 'Editar Registro' : 'Nuevo Registro'}
                        </h5>

                        <div className="row g-4">
                            {/* Logo */}
                            <div className="col-md-3">
                                <UploadZone
                                    image={formData.logo_url}
                                    onUpload={handleUploadLogo}
                                    onRemove={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                                    subiendo={subiendo}
                                    required
                                />
                            </div>

                            {/* Inputs */}
                            <div className="col-md-9">
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-secondary">Nombre de la Entidad <span className="text-danger">*</span></label>
                                    <input type="text" className="form-control fw-bold" name="nombre" placeholder="Ej: Microsoft, Universidad de Chile..." value={formData.nombre} onChange={handleChange} required />
                                </div>

                                <div className="row g-3">
                                    {/* 1. Categoría */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-secondary">Categoría (Sección)</label>
                                        <input className="form-control" list="listTipos" name="tipo_entidad" placeholder="Seleccionar..." value={formData.tipo_entidad} onChange={handleChange} />
                                        <datalist id="listTipos">{sugerencias.tipos.map((t, i) => <option key={i} value={t} />)}</datalist>
                                    </div>

                                    {/* 2. Tipo Convenio */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-secondary">Tipo de Convenio (Tabla)</label>
                                        <input className="form-control" list="listEstados" name="estado_convenio" placeholder="Ej: Acuerdo Marco" value={formData.estado_convenio} onChange={handleChange} />
                                        <datalist id="listEstados">{sugerencias.estados.map((e, i) => <option key={i} value={e} />)}</datalist>
                                    </div>

                                    {/* 3. País */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-secondary">País</label>
                                        <input className="form-control" list="listPaises" name="pais" placeholder="Ej: Chile" value={formData.pais} onChange={handleChange} />
                                        <datalist id="listPaises">{sugerencias.paises.map((p, i) => <option key={i} value={p} />)}</datalist>
                                    </div>

                                    {/* 4. FECHA DE FIRMA (AGREGADO) */}
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold small text-secondary">Fecha de Firma</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            name="fecha_firma" 
                                            value={formData.fecha_firma} 
                                            onChange={handleChange} 
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-bold small text-secondary">Sitio Web</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-white text-muted">https://</span>
                                            <input type="text" className="form-control" name="link_web" value={formData.link_web} onChange={handleChange} placeholder="www.susitio.com" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4 pt-3 border-top">
                            <button 
                                type="submit" 
                                className="btn w-100 fw-bold text-white shadow-sm"
                                disabled={subiendo}
                                style={{ backgroundColor: '#003767' }}
                            >
                                {subiendo ? 'Subiendo...' : (idEdicion ? 'Guardar Cambios' : 'Registrar Entidad')}
                            </button>
                            {idEdicion && (
                                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* --- DERECHA: HISTORIAL (RESTAURADO ORIGINAL) --- */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 bg-white h-100" style={{ maxHeight: '85vh' }}>
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 fw-bold text-secondary">
                                Historial ({listaAlianzas.length})
                            </h6>
                        </div>
                        
                        <div className="card-body p-0 overflow-auto">
                            <div className="list-group list-group-flush">
                                {listaAlianzas.length === 0 && (
                                    <div className="text-center text-muted p-5 small">Sin registros aún.</div>
                                )}

                                {listaAlianzas.map(item => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => cargarEdicion(item)}
                                        className={`list-group-item d-flex gap-3 align-items-center p-3 transition-all ${idEdicion === item.id ? 'bg-primary bg-opacity-10 border-primary' : ''}`}
                                        style={{
                                            cursor: 'pointer',
                                            borderLeft: idEdicion === item.id ? '4px solid #003767' : '4px solid transparent'
                                        }}
                                    >
                                        {/* Miniatura Cuadrada */}
                                        <div 
                                            className="rounded bg-white border d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ width: '50px', height: '50px' }}
                                        >
                                            {item.logo_url ? (
                                                <img src={item.logo_url} className="w-100 h-100 object-fit-contain p-1" alt="" />
                                            ) : (
                                                <span className="fw-bold text-muted">{item.nombre.charAt(0)}</span>
                                            )}
                                        </div>

                                        {/* Textos */}
                                        <div className="flex-grow-1 overflow-hidden">
                                            <h6 className={`mb-0 fw-bold text-truncate ${idEdicion === item.id ? 'text-primary' : 'text-dark'}`}>
                                                {item.nombre}
                                            </h6>
                                            <small className="text-muted text-truncate d-block">
                                                {item.tipo_entidad || 'Sin Clasificar'}
                                            </small>
                                        </div>

                                        {/* Botones Originales */}
                                        <div className="d-flex gap-1">
                                            <button 
                                                className="btn btn-sm btn-light text-primary border-0" 
                                                title="Editar"
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} 
                                                className="btn btn-sm btn-light text-danger border-0"
                                                title="Eliminar"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}