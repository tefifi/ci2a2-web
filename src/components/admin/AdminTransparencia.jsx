import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminTransparencia() {
    const [lista, setLista] = useState([]);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    const [form, setForm] = useState({
        anio: new Date().getFullYear(),
        concurso: '',
        titulo: '',
        descripcion: '',
        director: '',
        participantes: '',
        monto: '',
        link_resolucion: ''
    });

    useEffect(() => { fetchDatos(); }, []);

    const fetchDatos = async () => {
        const { data } = await supabase
            .from('proyectos_adjudicados')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setLista(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje(null);

        try {
            if (editId) {
                const { error } = await supabase
                    .from('proyectos_adjudicados')
                    .update(form)
                    .eq('id', editId);

                if (error) throw error;
                setMensaje({ tipo: 'success', texto: '¡Proyecto actualizado correctamente!' });
            } else {
                const { error } = await supabase
                    .from('proyectos_adjudicados')
                    .insert([form]);

                if (error) throw error;
                setMensaje({ tipo: 'success', texto: '¡Proyecto creado correctamente!' });
            }

            resetForm();
            fetchDatos();
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error(error);
            setMensaje({ tipo: 'danger', texto: "Error al guardar el proyecto." });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ 
            anio: new Date().getFullYear(), 
            concurso: '', 
            titulo: '', 
            descripcion: '', 
            director: '', 
            participantes: '', 
            monto: '', 
            link_resolucion: '' 
        });
        setEditId(null);
    };

    const handleEdit = (p) => {
        setForm(p);
        setEditId(p.id);
        setMensaje(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este proyecto?')) {
            try {
                const { error } = await supabase.from('proyectos_adjudicados').delete().eq('id', id);
                if (error) throw error;
                fetchDatos();
                setMensaje({ tipo: 'success', texto: 'Proyecto eliminado correctamente.' });
            } catch (error) {
                setMensaje({ tipo: 'danger', texto: "Error al eliminar." });
            }
        }
    };

    return (
        // Usamos un Fragmento <> para agrupar el título fuera del row
        <>
            {/* 1. TÍTULO Y ALERTA FUERA DE LAS COLUMNAS */}
            <div className="mb-4">
                <h2 className="fw-bold" style={{ color: '#003767' }}>
                    Gestión de Transparencia
                </h2>
                {mensaje && (
                    <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show shadow-sm border-0 mt-3`}>
                        <i className={`bi ${mensaje.tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                        {mensaje.texto}
                        <button className="btn-close" onClick={() => setMensaje(null)}></button>
                    </div>
                )}
            </div>

            {/* 2. ROW INICIA AQUÍ: FORMULARIO Y LISTA ALINEADOS */}
            <div className="row g-4 align-items-start">
                
                {/* COLUMNA IZQUIERDA: FORMULARIO */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 rounded-4 p-4 sticky-top" style={{ top: '2rem', zIndex: 10 }}>
                        <h5 className="card-title mb-4 fw-bold text-dark border-bottom pb-2">
                            <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: '#003767' }}></i>
                            {editId ? 'Editar' : 'Nuevo'} Proyecto
                        </h5>

                        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                            {/* ... (Todo el contenido del formulario se mantiene igual) ... */}
                            <div className="row g-2">
                                <div className="col-4">
                                    <label className="small fw-bold text-secondary">Año</label>
                                    <input type="number" className="form-control" value={form.anio} onChange={e => setForm({...form, anio: e.target.value})} required />
                                </div>
                                <div className="col-8">
                                    <label className="small fw-bold text-secondary">Concurso / Fuente</label>
                                    <input type="text" className="form-control" value={form.concurso} onChange={e => setForm({...form, concurso: e.target.value})} placeholder="Ej: Fondequip Mayor 2025" required />
                                </div>
                            </div>
                            
                            <div>
                                <label className="small fw-bold text-secondary">Título del Proyecto</label>
                                <input type="text" className="form-control" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} required />
                            </div>

                            <div>
                                <label className="small fw-bold text-secondary">Descripción Detallada</label>
                                <textarea className="form-control" rows="5" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} required />
                            </div>

                            <div className="row g-2">
                                <div className="col-6">
                                    <label className="small fw-bold text-secondary">Director(a)</label>
                                    <input type="text" className="form-control" value={form.director} onChange={e => setForm({...form, director: e.target.value})} required />
                                </div>
                                <div className="col-6">
                                    <label className="small fw-bold text-secondary">Monto Subsidio</label>
                                    <input type="text" className="form-control" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} placeholder="$0.000.000" />
                                </div>
                            </div>

                            <div>
                                <label className="small fw-bold text-secondary">Participantes (Separados por coma)</label>
                                <textarea className="form-control" rows="2" value={form.participantes} onChange={e => setForm({...form, participantes: e.target.value})} />
                            </div>

                            <div>
                                <label className="small fw-bold text-secondary">Link Documentación (URL PDF)</label>
                                <input type="url" className="form-control" value={form.link_resolucion} onChange={e => setForm({...form, link_resolucion: e.target.value})} />
                            </div>

                            <div className="d-flex gap-2 pt-2">
                                <button 
                                    type="submit" 
                                    className="btn btn-primary fw-bold border-0 py-2 flex-fill" 
                                    style={{background: '#003767'}} 
                                    disabled={loading}
                                >
                                    {loading ? 'Guardando...' : (editId ? 'Guardar Cambios' : 'Publicar en Transparencia')}
                                </button>
                                
                                {editId && (
                                    <button type="button" onClick={resetForm} className="btn btn-light fw-bold py-2 flex-fill">
                                        <i className="bi bi-x-lg me-2"></i>Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* COLUMNA DERECHA: LISTA */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 rounded-4 overflow-hidden" style={{maxHeight: '800px', overflowY: 'auto'}}>
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 fw-bold text-secondary">Historial ({lista.length})</h6>
                        </div>
                        <div className="list-group list-group-flush">
                            {lista.map(p => (
                                <div 
                                    key={p.id} 
                                    className={`list-group-item p-3 border-bottom transition-all ${editId === p.id ? 'bg-primary bg-opacity-10' : ''}`}
                                    style={editId === p.id ? { borderLeft: '5px solid #003767' } : { borderLeft: '5px solid transparent' }}
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="me-2 overflow-hidden">
                                            <small className="fw-bold text-uppercase d-block mb-1 text-truncate" style={{ color: '#d63384', fontSize: '0.7rem' }}>
                                                {p.concurso || 'Sin concurso'}
                                            </small>
                                            <h6 className="mb-0 fw-bold text-dark text-truncate" style={{ fontSize: '0.9rem' }} title={p.titulo}>
                                                {p.titulo}
                                            </h6>
                                        </div>

                                        <div className="d-flex gap-1 flex-shrink-0">
                                            <button onClick={() => handleEdit(p)} className="btn btn-sm btn-light text-primary border-0" title="Editar">
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-light text-danger border-0" title="Eliminar">
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {lista.length === 0 && (
                                <div className="p-4 text-center text-muted small">No hay proyectos registrados.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}