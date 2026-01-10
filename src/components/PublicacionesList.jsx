import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PublicacionesList() {
    const [papers, setPapers] = useState([]);
    const [filteredPapers, setFilteredPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        year: 'Todos',
        area: 'Todos',
        type: 'Todos'
    });

    const [options, setOptions] = useState({ years: [], areas: [], types: [] });

    useEffect(() => {
        fetchPapers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, papers]);

    const fetchPapers = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('publicaciones')
            .select('*')
            .eq('is_visible', true)
            .order('year', { ascending: false });

        if (data) {
            setPapers(data);
            const uniqueYears = [...new Set(data.map(p => p.year))].sort().reverse();
            const uniqueAreas = [...new Set(data.map(p => p.area).filter(Boolean))].sort();
            const uniqueTypes = [...new Set(data.map(p => p.type).filter(Boolean))].sort();
            setOptions({ years: uniqueYears, areas: uniqueAreas, types: uniqueTypes });
        }
        setLoading(false);
    };

    const applyFilters = () => {
        let result = papers;

        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(term) ||
                (p.resumen && p.resumen.toLowerCase().includes(term))
            );
        }
        if (filters.year !== 'Todos') result = result.filter(p => p.year == filters.year);
        if (filters.area !== 'Todos') result = result.filter(p => p.area === filters.area);
        if (filters.type !== 'Todos') result = result.filter(p => p.type === filters.type);

        setFilteredPapers(result);
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const openModal = (paper) => {
        setSelectedPaper(paper);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setSelectedPaper(null);
        document.body.style.overflow = 'auto';
    };

    const getIcon = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('journal') || t.includes('artículo')) return 'bi-journal-text';
        if (t.includes('conference') || t.includes('congreso')) return 'bi-people-fill';
        return 'bi-file-earmark-richtext';
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <>
            <div className="row g-4">

                {/* === SIDEBAR IZQUIERDO === */}
                <div className="col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: '20px', zIndex: 5 }}>
                        <h5 className="fw-bold text-primary mb-4">
                            <i className="bi bi-funnel-fill me-2"></i> Filtros
                        </h5>

                        <div className="d-flex flex-column gap-3">
                            {/* Buscador */}
                            <div>
                                <label className="form-label small fw-bold text-muted text-uppercase">Búsqueda</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-search"></i></span>
                                    <input
                                        type="text"
                                        className="form-control bg-light border-start-0"
                                        placeholder="Palabra clave..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Año */}
                            <div>
                                <label className="form-label small fw-bold text-muted text-uppercase">Año</label>
                                <select className="form-select bg-light border-0 py-2" value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)}>
                                    <option value="Todos">Todos los años</option>
                                    {options.years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>

                            {/* Área */}
                            <div>
                                <label className="form-label small fw-bold text-muted text-uppercase">Área Temática</label>
                                <select className="form-select bg-light border-0 py-2" value={filters.area} onChange={(e) => handleFilterChange('area', e.target.value)}>
                                    <option value="Todos">Todas las áreas</option>
                                    {options.areas.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>

                            {/* Tipo */}
                            <div>
                                <label className="form-label small fw-bold text-muted text-uppercase">Tipo de Publicación</label>
                                <select className="form-select bg-light border-0 py-2" value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
                                    <option value="Todos">Todos los tipos</option>
                                    {options.types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <hr className="text-muted opacity-25 my-2" />

                            <button
                                className="btn btn-outline-danger w-100 border-0 bg-light text-danger"
                                onClick={() => setFilters({ search: '', year: 'Todos', area: 'Todos', type: 'Todos' })}
                            >
                                <i className="bi bi-trash me-1"></i> Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* === COLUMNA DERECHA === */}
                <div className="col-lg-9">

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted small">Mostrando <strong>{filteredPapers.length}</strong> publicaciones</span>
                    </div>

                    <div className="row g-4">
                        {filteredPapers.map(paper => (
                            <div key={paper.id} className="col-12 col-md-6 d-flex">
                                <div
                                    className="card h-100 border-0 shadow-sm rounded-4 modern-card p-4 w-100 cursor-pointer card-link-wrapper"
                                    onClick={() => openModal(paper)}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                                            <i className={`bi ${getIcon(paper.type)} fs-5 text-primary`}></i>
                                        </div>
                                        <span className="badge bg-light text-secondary border rounded-pill px-3">{paper.year}</span>
                                    </div>

                                    {paper.area && (
                                        <div className="mb-2">
                                            <span className="text-uppercase small fw-bold text-primary" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>
                                                {paper.area}
                                            </span>
                                        </div>
                                    )}

                                    <h6 className="card-title fw-bold text-dark mb-2 lh-sm line-clamp-2" style={{ fontSize: '1.1rem' }}>
                                        {paper.title}
                                    </h6>

                                    <p className="card-text text-secondary small line-clamp-3 mb-4 flex-grow-1" style={{ fontSize: '0.85rem' }}>
                                        {paper.resumen || "Sin resumen disponible..."}
                                    </p>

                                    <div className="mt-auto pt-3 border-top border-light d-flex justify-content-between align-items-center w-100">
                                        <small className="text-muted fst-italic" style={{ fontSize: '0.8rem' }}>{paper.type}</small>
                                        <div className="text-primary small fw-bold d-flex align-items-center gap-1">
                                            Ver detalle <i className="bi bi-arrow-right transition-icon"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredPapers.length === 0 && (
                        <div className="text-center py-5">
                            <div className="mb-3 text-muted opacity-50"><i className="bi bi-search display-1"></i></div>
                            <h5 className="text-secondary fw-light">No encontramos resultados.</h5>
                        </div>
                    )}
                </div>
            </div>

            {/* === MODAL === */}
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
                                <div className="col-md-6 mb-3">
                                    <strong className="d-block text-muted small text-uppercase">Área</strong>
                                    <span className="fw-medium">{selectedPaper.area}</span>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <strong className="d-block text-muted small text-uppercase">Tipo</strong>
                                    <span className="fw-medium">{selectedPaper.type}</span>
                                </div>
                                {selectedPaper.autores && (
                                    <div className="col-12">
                                        <strong className="d-block text-muted small text-uppercase mb-1">Autores</strong>
                                        <div className="p-2 bg-light rounded text-secondary border-start border-4 border-primary">
                                            {selectedPaper.autores}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Resumen / Abstract</h6>
                            <p className="text-secondary" style={{ lineHeight: '1.7', textAlign: 'justify' }}>
                                {selectedPaper.resumen || "No hay resumen disponible."}
                            </p>
                        </div>

                        <div className="p-3 bg-light border-top text-end">
                            <button className="btn btn-outline-secondary me-2 rounded-pill px-4" onClick={closeModal}>Cerrar</button>
                            {selectedPaper.url && (
                                <a href={selectedPaper.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary rounded-pill px-4">
                                    Leer Paper <i className="bi bi-box-arrow-up-right ms-2"></i>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .modal-backdrop-custom {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.5); z-index: 1050; backdrop-filter: blur(3px); animation: fadeIn 0.2s ease;
        }
        .modal-content-custom { width: 95%; max-width: 750px; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
        </>
    );
}