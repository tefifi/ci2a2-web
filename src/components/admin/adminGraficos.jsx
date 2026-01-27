import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// --- COMPONENTE AUXILIAR (Tarjeta) ---
const ToggleCard = ({ clave, titulo, descripcion, icono, countReal, config, onToggle, colorIcono = 'text-primary' }) => (
    <div className="col-md-6 col-xl-3">
        <div className={`card h-100 border-0 shadow-sm p-3 transition-all ${config[clave] ? 'bg-white' : 'bg-light opacity-75'}`}>
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div className={`rounded-circle p-2 bg-light d-flex align-items-center justify-content-center ${colorIcono}`} style={{width: '45px', height: '45px'}}>
                    <i className={`bi ${icono} fs-4`}></i>
                </div>
                <div className="form-check form-switch">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        role="switch" 
                        id={`switch-${clave}`}
                        checked={!!config[clave]}
                        onChange={() => onToggle(clave)}
                        style={{ cursor: 'pointer', width: '3em', height: '1.5em' }}
                    />
                </div>
            </div>
            
            <h6 className="fw-bold text-dark mb-1">{titulo}</h6>
            <p className="text-muted small mb-2" style={{fontSize: '0.85rem'}}>{descripcion}</p>
            
            {countReal !== undefined && (
                <div className="mt-auto pt-2 border-top">
                    <small className="text-secondary fw-bold" style={{fontSize: '0.75rem'}}>
                        RESUMEN DATOS: <span className="text-dark d-block mt-1 text-truncate" title={countReal}>{countReal}</span>
                    </small>
                </div>
            )}
        </div>
    </div>
);

export default function AdminGraficos() {
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState(null);
    const [config, setConfig] = useState({});
    
    // Estado para guardar los resúmenes de datos
    const [stats, setStats] = useState({
        colaboradores: 0,
        proyectos: 0,
        alianzas: 0,
        publicaciones: 0,
        // Nuevos datos procesados
        resumenAnios: "Cargando...",
        resumenAreas: "Cargando..."
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Obtener Configuración (Interruptores)
            const { data: configData, error: configError } = await supabase
                .from('config_graficos')
                .select('*');
            
            if (configError) throw configError;

            const configMap = {};
            configData?.forEach(item => {
                configMap[item.clave] = item.activo;
            });
            setConfig(configMap);

            // 2. Obtener Datos Reales para procesar
            // Nota: Para proyectos traemos fecha_inicio y area para calcular los gráficos
            const [colabs, dataProyectos, alianzas, papers] = await Promise.all([
                supabase.from('colaboradores').select('*', { count: 'exact', head: true }),
                supabase.from('proyectos').select('fecha_inicio, area'), // Traemos datos, no solo head
                supabase.from('alianzas').select('*', { count: 'exact', head: true }),
                supabase.from('publicaciones').select('*', { count: 'exact', head: true })
            ]);

            // --- LÓGICA DE PROCESAMIENTO DE PROYECTOS ---
            const listaProyectos = dataProyectos.data || [];
            
            // A. Procesar Años (Proyectos por Año)
            const conteoAnios = {};
            listaProyectos.forEach(p => {
                if (p.fecha_inicio) {
                    const anio = new Date(p.fecha_inicio).getFullYear();
                    conteoAnios[anio] = (conteoAnios[anio] || 0) + 1;
                }
            });
            // Convertir a string legible para el admin (ej: "2023(5), 2024(2)")
            const textoAnios = Object.entries(conteoAnios)
                .sort(([anioA], [anioB]) => anioB - anioA) // Ordenar descendente
                .map(([anio, cant]) => `${anio} (${cant})`)
                .join(', ') || "Sin fechas";

            // B. Procesar Áreas (Áreas de Investigación)
            const conteoAreas = {};
            listaProyectos.forEach(p => {
                const area = p.area || 'Sin definir'; // Asumiendo que la columna se llama 'area'
                conteoAreas[area] = (conteoAreas[area] || 0) + 1;
            });
            // Convertir a string legible
            const textoAreas = Object.entries(conteoAreas)
                .sort(([, cantA], [, cantB]) => cantB - cantA) // Ordenar por cantidad
                .map(([nombre, cant]) => `${nombre} (${cant})`)
                .join(', ') || "Sin áreas";


            // 3. Actualizar Estado
            setStats({
                colaboradores: colabs.count || 0,
                proyectos: listaProyectos.length || 0,
                alianzas: alianzas.count || 0,
                publicaciones: papers.count || 0,
                resumenAnios: textoAnios,
                resumenAreas: textoAreas
            });

        } catch (error) {
            console.error("Error cargando datos:", error);
            setMensaje({ tipo: 'danger', texto: 'Error al cargar configuraciones.' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (clave) => {
        const nuevoValor = !config[clave];
        setConfig(prev => ({ ...prev, [clave]: nuevoValor }));

        try {
            const { error } = await supabase
                .from('config_graficos')
                .update({ activo: nuevoValor })
                .eq('clave', clave);

            if (error) throw error;
        } catch (error) {
            console.error('Error actualizando:', error);
            setConfig(prev => ({ ...prev, [clave]: !nuevoValor }));
            setMensaje({ tipo: 'danger', texto: 'No se pudo guardar el cambio.' });
        }
    };

    return (
        <div className="container-fluid p-0">
            {/* --- HEADER --- */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold m-0" style={{ color: '#003767' }}>Gestión de Métricas y Gráficos</h2>
                <button className="btn btn-sm btn-outline-secondary" onClick={fetchData}>
                    <i className="bi bi-arrow-clockwise me-2"></i>Refrescar Datos
                </button>
            </div>

            {mensaje && (
                <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show mb-4 shadow-sm border-0`}>
                    {mensaje.texto}
                    <button type="button" className="btn-close" onClick={() => setMensaje(null)}></button>
                </div>
            )}

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted small">Cargando panel...</p>
                </div>
            ) : (
                <div className="row g-4">
                    
                    {/* SECCIÓN 1: CONTADORES */}
                    <div className="col-12">
                        <h6 className="fw-bold text-secondary text-uppercase ls-1 mb-3 border-bottom pb-2">
                            <i className="bi bi-123 me-2"></i>Cifras de Impacto (Contadores)
                        </h6>
                        <div className="row g-3">
                            <ToggleCard 
                                clave="stat_colaboradores" 
                                titulo="Total Colaboradores" 
                                descripcion="Suma de personas en la tabla 'colaboradores'."
                                icono="bi-people-fill"
                                colorIcono="text-primary"
                                countReal={stats.colaboradores}
                                config={config}
                                onToggle={handleToggle}
                            />
                            <ToggleCard 
                                clave="stat_proyectos" 
                                titulo="Proyectos I+D" 
                                descripcion="Suma de registros en 'proyectos'."
                                icono="bi-briefcase-fill"
                                colorIcono="text-success"
                                countReal={stats.proyectos}
                                config={config}
                                onToggle={handleToggle}
                            />
                            <ToggleCard 
                                clave="stat_alianzas" 
                                titulo="Total Alianzas" 
                                descripcion="Suma de registros en 'alianzas'."
                                icono="bi-globe"
                                colorIcono="text-info"
                                countReal={stats.alianzas}
                                config={config}
                                onToggle={handleToggle}
                            />
                            <ToggleCard 
                                clave="stat_papers" 
                                titulo="Publicaciones" 
                                descripcion="Suma de registros en 'publicaciones'."
                                icono="bi-journal-text"
                                colorIcono="text-warning"
                                countReal={stats.publicaciones}
                                config={config}
                                onToggle={handleToggle}
                            />
                        </div>
                    </div>

                    {/* SECCIÓN 2: GRÁFICOS */}
                    <div className="col-12 mt-4">
                        <h6 className="fw-bold text-secondary text-uppercase ls-1 mb-3 border-bottom pb-2">
                            <i className="bi bi-pie-chart-fill me-2"></i>Visualización de Datos (Gráficos)
                        </h6>
                        <div className="row g-3">
                            <ToggleCard 
                                clave="chart_proyectos_anio" 
                                titulo="Proyectos por Año" 
                                descripcion="Gráfico de Línea/Barra. Extraído de 'fecha_inicio' en Proyectos."
                                icono="bi-graph-up-arrow"
                                colorIcono="text-success"
                                countReal={stats.resumenAnios} 
                                config={config}
                                onToggle={handleToggle}
                            />
                            <ToggleCard 
                                clave="chart_areas" 
                                titulo="Áreas de Investigación" 
                                descripcion="Gráfico de Dona. Extraído de la columna 'area' en Proyectos."
                                icono="bi-pie-chart"
                                colorIcono="text-secondary"
                                countReal={stats.resumenAreas}
                                config={config}
                                onToggle={handleToggle}
                            />
                            <ToggleCard 
                                clave="chart_roles" 
                                titulo="Distribución por Roles" 
                                descripcion="Gráfico de Barras. Agrupa colaboradores por su cargo."
                                icono="bi-bar-chart-fill"
                                colorIcono="text-primary"
                                countReal="Calculado en Front"
                                config={config}
                                onToggle={handleToggle}
                            />
                            <ToggleCard 
                                clave="chart_carreras" 
                                titulo="Carreras / Profesión" 
                                descripcion="Gráfico de Dona. Agrupa colaboradores por su título."
                                icono="bi-mortarboard-fill"
                                colorIcono="text-danger"
                                countReal="Calculado en Front"
                                config={config}
                                onToggle={handleToggle}
                            />
                        </div>
                    </div>

                    <div className="col-12 mt-2">
                        <div className="alert alert-light border d-flex align-items-center" role="alert">
                            <i className="bi bi-info-circle-fill text-primary me-3 fs-4"></i>
                            <div>
                                <small className="d-block fw-bold text-dark">¿Cómo funciona?</small>
                                <small className="text-muted">
                                    Al activar los interruptores, la página pública "Nosotros" generará los gráficos automáticamente usando los datos reales mostrados aquí. 
                                    Si ocultas un gráfico aquí, desaparecerá de la web pública.
                                </small>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}