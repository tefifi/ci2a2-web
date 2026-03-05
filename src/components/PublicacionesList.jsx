import { useState, useEffect } from 'react';
import { supabasePublic as supabase } from '../lib/supabase';

export default function PublicacionesList() {
    const [papers, setPapers] = useState([]);
    const [filteredPapers, setFilteredPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPaper, setSelectedPaper] = useState(null);

    const initialFilters = { search: '', year: 'Todos', area: 'Todos', type: 'Todos' };
    const [filters, setFilters] = useState(initialFilters);
    const [options, setOptions] = useState({ years: [], areas: [], types: [] });

    useEffect(() => { fetchPapers(); }, []);
    useEffect(() => { applyFilters(); }, [filters, papers]);

    const fetchPapers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('publicaciones')
                .select('*')
                .eq('is_visible', true)
                .order('year', { ascending: false });

            if (error) throw error;

            if (data) {
                setPapers(data);
                const uniqueYears = [...new Set(data.map(p => String(p.year)))].sort().reverse();
                const uniqueAreas = [...new Set(data.map(p => p.area ? p.area.trim() : null).filter(Boolean))].sort();
                const uniqueTypes = [...new Set(data.map(p => p.type ? p.type.trim() : null).filter(Boolean))].sort();
                setOptions({ years: uniqueYears, areas: uniqueAreas, types: uniqueTypes });
            }
        } catch (error) {
            console.error("Error cargando publicaciones:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = papers;
        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(p => {
                // Como ya limpiamos en el backend, la búsqueda es directa y sencilla
                return (p.title && p.title.toLowerCase().includes(term)) ||
                    (p.resumen && p.resumen.toLowerCase().includes(term)) ||
                    (p.autores && p.autores.toLowerCase().includes(term));
            });
        }
        if (filters.year !== 'Todos') result = result.filter(p => String(p.year) === filters.year);
        if (filters.area !== 'Todos') result = result.filter(p => p.area && p.area.trim() === filters.area);
        if (filters.type !== 'Todos') result = result.filter(p => p.type && p.type.trim() === filters.type);
        setFilteredPapers(result);
    };

    const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
    const clearFilters = () => setFilters(initialFilters);

    const openModal = (paper) => { setSelectedPaper(paper); document.body.style.overflow = 'hidden'; };
    const closeModal = () => { setSelectedPaper(null); document.body.style.overflow = 'auto'; };

    const getIcon = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('journal') || t.includes('artículo')) return 'bi-journal-text';
        if (t.includes('conference') || t.includes('congreso')) return 'bi-people-fill';
        if (t.includes('libro') || t.includes('book')) return 'bi-book-half';
        if (t.includes('tesis')) return 'bi-mortarboard-fill';
        return 'bi-file-earmark-richtext';
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <>
            <div className="row g-4">
                {/* --- COLUMNA IZQUIERDA: FILTROS (Sin cambios) --- */}
                {/* --- COLUMNA IZQUIERDA: FILTROS MEJORADOS --- */}
                <div className="col-lg-3">
                    <div className="card filter-card shadow-sm rounded-4 p-4 sticky-top" style={{ top: '100px', zIndex: 5 }}>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold text-dark mb-0">
                                <i className="bi bi-sliders text-primary me-2"></i> Filtros
                            </h5>
                        </div>

                        <div className="d-flex flex-column gap-3">
                            {/* Buscador */}
                            <div>
                                <label className="filter-label">Búsqueda</label>
                                <div className="position-relative">
                                    <input
                                        type="text"
                                        className="form-control filter-input ps-4"
                                        placeholder="Título, autor..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                    />
                                    <i className="bi bi-search position-absolute text-muted" style={{ top: '50%', left: '10px', transform: 'translateY(-50%)', fontSize: '0.8rem' }}></i>
                                </div>
                            </div>

                            {/* Año */}
                            <div>
                                <label className="filter-label">Año</label>
                                <select className="form-select filter-input cursor-pointer" value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)}>
                                    <option value="Todos">Todos los años</option>
                                    {options.years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>

                            {/* Área */}
                            <div>
                                <label className="filter-label">Área Temática</label>
                                <select className="form-select filter-input cursor-pointer" value={filters.area} onChange={(e) => handleFilterChange('area', e.target.value)}>
                                    <option value="Todos">Todas las áreas</option>
                                    {options.areas.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>

                            {/* Tipo */}
                            <div>
                                <label className="filter-label">Tipo de Publicación</label>
                                <select className="form-select filter-input cursor-pointer" value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
                                    <option value="Todos">Todos los tipos</option>
                                    {options.types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <hr className="text-muted opacity-25 my-2" />

                            {/* Botón Limpiar Interactivo */}
                            <button
                                className="btn btn-sm btn-clear-filters w-100 rounded-3 py-2"
                                onClick={clearFilters}
                            >
                                <i className="bi bi-x-circle me-1"></i> Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>
                {/* --- COLUMNA DERECHA: RESULTADOS (AQUI ESTÁ EL CAMBIO) --- */}
                <div className="col-lg-9">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted small">Mostrando <strong>{filteredPapers.length}</strong> de <strong>{papers.length}</strong></span>
                    </div>

                    <div className="row g-4">
                        {filteredPapers.map(paper => (
                            <div key={paper.id} className="col-12 col-md-6">
                                {/* CLASE PRINCIPAL: modern-card */}
                                <div className="modern-card" onClick={() => openModal(paper)}>

                                    {/* CABECERA: ÍCONO + AÑO */}
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        {/* Icono suelto (el CSS lo pone rosado y lo alinea) */}
                                        <div className="icon-wrapper">
                                            <i className={`bi ${getIcon(paper.type)}`}></i>
                                        </div>
                                        <span className="badge bg-light text-secondary border rounded-pill px-3">{paper.year}</span>
                                    </div>

                                    {/* ÁREA (Usa h6 para que el CSS lo pinte azul) */}
                                    <h6 className="text-uppercase mb-2">
                                        {paper.area || "General"}
                                    </h6>

                                    {/* TÍTULO (Usa h5 para tamaño correcto) */}
                                    <h5 className="line-clamp-2 mb-3">
                                        {paper.title}
                                    </h5>

                                    {/* RESUMEN */}
                                    <p className="text-muted small line-clamp-3 mb-4">
                                        {paper.resumen || "Sin resumen disponible."}
                                    </p>

                                    {/* ENLACE FINAL (Clase read-more-link para la animación) */}
                                    <span className="read-more-link mt-auto">
                                        Ver detalle <i className="bi bi-arrow-right"></i>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredPapers.length === 0 && (
                        <div className="text-center py-5">
                            <h5 className="text-secondary fw-light">No hay resultados.</h5>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL (Estilo mejorado levemente) --- */}
            {/* --- MODAL (Con botón "Leer Paper" rosado) --- */}
            {selectedPaper && (
                <div className="modal-backdrop-custom d-flex justify-content-center align-items-center" onClick={closeModal}>
                    <div className="bg-white rounded-4 shadow-lg p-0 overflow-hidden modal-content-custom" onClick={e => e.stopPropagation()}>
                        <div className="bg-light p-4 border-bottom d-flex justify-content-between align-items-start">
                            <div style={{ width: '90%' }}>
                                <span className="badge bg-primary mb-2">{selectedPaper.year}</span>
                                <h5 className="fw-bold mb-0 text-dark lh-sm">{selectedPaper.title}</h5>
                            </div>
                            <button onClick={closeModal} className="btn btn-close"></button>
                        </div>
                        <div className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="row mb-4">
                                <div className="col-md-6 mb-3"><strong className="d-block text-muted small text-uppercase">Área</strong><span className="fw-medium">{selectedPaper.area || 'No especificada'}</span></div>
                                <div className="col-md-6 mb-3"><strong className="d-block text-muted small text-uppercase">Tipo</strong><span className="fw-medium">{selectedPaper.type || 'No especificado'}</span></div>

                                {selectedPaper.autores && (
                                    <div className="col-12">
                                        <strong className="d-block text-muted small text-uppercase mb-1">Autores</strong>
                                        <div className="p-2 bg-light rounded text-secondary border-start border-4 border-primary">
                                            {selectedPaper.autores}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Resumen</h6>
                            <p className="text-secondary" style={{ lineHeight: '1.7', textAlign: 'justify' }}>
                                {selectedPaper.resumen || "No hay resumen disponible."}
                            </p>
                        </div>
                        <div className="p-3 bg-light border-top text-end">
                            <button className="btn btn-outline-secondary me-2 rounded-pill px-4" onClick={closeModal}>Cerrar</button>
                            {selectedPaper.url &&
                                /* CAMBIO: Se usa la nueva clase 'btn-read-paper' */
                                <a href={selectedPaper.url} target="_blank" rel="noopener noreferrer" className="btn btn-read-paper rounded-pill px-4">
                                    Leer Paper
                                </a>
                            }
                        </div>
                    </div>
                </div>
            )}
            <style jsx="true">{`
            .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
            /* Animaciones del Modal */
            .modal-backdrop-custom { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 55, 103, 0.6); z-index: 1050; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease; }
            .modal-content-custom { width: 95%; max-width: 750px; border-top: 5px solid #d63384; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
        </>
    );
}