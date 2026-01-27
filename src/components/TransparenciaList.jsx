import React, { useState, useMemo } from 'react';

export default function TransparenciaList({ iniciales }) {
    const [search, setSearch] = useState('');
    const [yearFilter, setYearFilter] = useState('Todos');
    const [abierto, setAbierto] = useState(null);

    const filtrados = useMemo(() => {
        return iniciales.filter(p => {
            const contenido = `${p.titulo} ${p.director} ${p.concurso} ${p.fuente}`.toLowerCase();
            const matchesSearch = contenido.includes(search.toLowerCase());
            const matchesYear = yearFilter === 'Todos' || p.anio.toString() === yearFilter;
            return matchesSearch && matchesYear;
        });
    }, [search, yearFilter, iniciales]);

    return (
        <div className="transparencia-main-container">
            {/* Buscadores - Layout Controlado */}
            <div className="search-filter-grid mb-5">
                <div className="search-wrapper">
                    <div className="search-box-modern">
                        <i className={`bi ${search ? 'bi-x-lg text-danger' : 'bi-search'}`} 
                           onClick={() => setSearch('')} 
                           style={{ cursor: 'pointer' }}></i>
                        <input 
                            type="text" 
                            value={search}
                            placeholder="Buscar proyecto, director o concurso..." 
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="filter-wrapper">
                    <select className="select-modern" onChange={(e) => setYearFilter(e.target.value)}>
                        <option value="Todos">Todos los años</option>
                        {[...new Set(iniciales.map(p => p.anio))].sort((a,b)=>b-a).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lista de Proyectos */}
            <div className="proyectos-container-list">
                {filtrados.map((p) => (
                    <div key={p.id} className={`proyecto-card-v3 ${abierto === p.id ? 'is-open' : ''}`}>
                        {/* Header: Siempre alineado */}
                        <div className="card-header-v3" onClick={() => setAbierto(abierto === p.id ? null : p.id)}>
                            <div className="header-left">
                                <span className="badge-year">{p.anio}</span>
                                <div className="title-group">
                                    <span className="text-concurso">{p.concurso || p.fuente}</span>
                                    <h5 className="text-titulo">{p.titulo}</h5>
                                </div>
                            </div>
                            <div className="header-right">
                                <div className={`icon-circle ${abierto === p.id ? 'active' : ''}`}>
                                    <i className={`bi bi-chevron-down`}></i>
                                </div>
                            </div>
                        </div>

                        {/* Contenido Expandible */}
                        <div className="card-expand-content" style={{ maxHeight: abierto === p.id ? '1000px' : '0' }}>
                            <div className="inner-padding">
                                {p.descripcion && (
                                    <div className="desc-box">
                                        <p>{p.descripcion}</p>
                                    </div>
                                )}
                                
                                <div className="details-grid">
                                    <div className="detail-item">
                                        <i className="bi bi-person-circle"></i>
                                        <div>
                                            <small>Director</small>
                                            <p>{p.director || p.investigador}</p>
                                        </div>
                                    </div>
                                    {p.monto && (
                                        <div className="detail-item">
                                            <div>
                                                <small>Monto</small>
                                                <p className="monto-highlight">{p.monto}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {p.participantes && (
                                    <div className="equipo-box">
                                        <small>Equipo Participante</small>
                                        <p>{p.participantes}</p>
                                    </div>
                                )}

                                {p.link_resolucion && (
                                    <a href={p.link_resolucion} target="_blank" className="btn-download">
                                        Documentación Oficial <i className="bi bi-box-arrow-up-right ms-2"></i>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .transparencia-main-container { width: 100%; max-width: 1100px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif; }
                
                /* Layout del Buscador */
                .search-filter-grid { display: grid; grid-template-columns: 1fr 250px; gap: 20px; }
                .search-box-modern { display: flex; align-items: center; background: #fff; padding: 12px 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
                .search-box-modern input { border: none; width: 100%; outline: none; margin-left: 10px; font-size: 0.95rem; }
                .select-modern { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; }

                /* Tarjetas */
                .proyectos-container-list { display: flex; flex-direction: column; gap: 15px; }
                .proyecto-card-v3 { background: #fff; border-radius: 16px; border: 1px solid #eef2f6; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
                .proyecto-card-v3:hover { border-color: #d63384; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
                .proyecto-card-v3.is-open { border-color: #003767; box-shadow: 0 15px 30px rgba(0,55,103,0.1); }

                /* Header Interno */
                .card-header-v3 { padding: 20px 25px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
                .header-left { display: flex; align-items: center; gap: 20px; flex: 1; }
                .badge-year { background: #f1f5f9; color: #003767; font-weight: 800; padding: 6px 12px; border-radius: 8px; font-size: 0.9rem; }
                .text-concurso { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #d63384; display: block; margin-bottom: 2px; }
                .text-titulo { font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0; line-height: 1.4; }
                
                .icon-circle { width: 35px; height: 35px; border-radius: 50%; background: #f8fafc; display: flex; align-items: center; justify-content: center; transition: 0.3s; color: #64748b; }
                .icon-circle.active { background: #003767; color: #fff; transform: rotate(180deg); }

                /* Contenido Expandido */
                .card-expand-content { transition: max-height 0.5s ease-in-out; background: #fafbfc; }
                .inner-padding { padding: 0 25px 30px 85px; } /* Alineado con el título */
                .desc-box { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 20px; }
                .desc-box p { color: #475569; font-size: 0.95rem; line-height: 1.6; margin: 0; }

                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .detail-item { display: flex; align-items: center; gap: 12px; }
                .detail-item i { font-size: 1.2rem; color: #003767; }
                .detail-item small { display: block; font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
                .detail-item p { margin: 0; font-weight: 600; color: #1e293b; font-size: 0.9rem; }
                .monto-highlight { color: #10b981 !important; }

                .equipo-box { padding: 15px; background: #f1f5f9; border-radius: 10px; margin-bottom: 20px; }
                .equipo-box small { display: block; margin-bottom: 5px; font-weight: 700; color: #64748b; font-size: 0.7rem; text-transform: uppercase; }
                .equipo-box p { font-size: 0.85rem; margin: 0; color: #334155; }

                .btn-download { display: inline-flex; align-items: center; padding: 10px 20px; background: #003767; color: #fff; text-decoration: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; transition: 0.2s; }
                .btn-download:hover { background: #d63384; transform: translateY(-2px); color: #fff; }

                @media (max-width: 768px) {
                    .search-filter-grid { grid-template-columns: 1fr; }
                    .inner-padding { padding: 0 20px 25px 20px; }
                    .header-left { gap: 12px; }
                    .details-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}