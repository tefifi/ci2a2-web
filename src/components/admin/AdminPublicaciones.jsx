import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { syncZoteroToSupabase } from '../../lib/zotero';

export default function AdminPublicaciones() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Cargar papers desde Supabase
  const fetchPapers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('publicaciones')
      .select('*')
      .order('year', { ascending: false })
      .order('title', { ascending: true });
    setPapers(data || []);
    setLoading(false);
  };

  // Función de Sincronización
  const handleSync = async (silent = false) => {
    if (syncing) return; 
    setSyncing(true);
    

    await syncZoteroToSupabase();
    await fetchPapers(); 
    setSyncing(false);
    
  };

  useEffect(() => { 
    fetchPapers(); 

    // ---  ZONA AUTOMÁTICA ---
    
    handleSync(true); 
  }, []);

  const updateField = async (id, field, value) => {
    setPapers(papers.map(p => p.id === id ? { ...p, [field]: value } : p));
    await supabase.from('publicaciones').update({ [field]: value }).eq('id', id);
  };

  const toggleVisibility = async (id, currentStatus) => {
    setPapers(papers.map(p => p.id === id ? { ...p, is_visible: !currentStatus } : p));
    await supabase.from('publicaciones').update({ is_visible: !currentStatus }).eq('id', id);
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm border">
      
      {/* --- BARRA SUPERIOR --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h4 className="m-0 text-primary fw-bold">Gestión de Publicaciones</h4>
            <small className="text-muted">Total: {papers.length} documentos</small>
        </div>

        {/* BOTÓN CON TEXTO CAMBIADO */}
        <button 
            onClick={() => handleSync(false)} 
            disabled={syncing} 
            className="btn btn-primary btn-sm d-flex align-items-center gap-2"
        >
            {syncing ? (
                <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Sincronizando...
                </>
            ) : (
                <>
                    <i className="bi bi-arrow-repeat"></i> Sincronizar
                </>
            )}
        </button>
      </div>

      {/* --- TABLA --- */}
      {loading && !papers.length ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th style={{width: '80px'}}>Año</th>
                <th>Título</th>
                <th style={{width: '200px'}}>Categoría</th>
                <th style={{width: '200px'}}>Área</th>
                <th style={{width: '80px', textAlign: 'center'}}>Ver</th>
              </tr>
            </thead>
            <tbody>
              {papers.map((paper) => (
                <tr key={paper.id} style={{ opacity: paper.is_visible ? 1 : 0.6 }}>
                  <td className="fw-bold text-secondary">{paper.year}</td>
                  <td>
                      <span className="d-block fw-semibold text-dark" style={{fontSize: '0.95rem'}}>{paper.title}</span>
                      <small className="text-muted fst-italic" style={{fontSize: '0.8rem'}}>{paper.type}</small>
                  </td>
                  
                  <td>
                    <input 
                        className="form-control form-control-sm"
                        list="datalist-categorias" 
                        placeholder="Elegir..."
                        value={paper.categoria || ''}
                        onChange={(e) => updateField(paper.id, 'categoria', e.target.value)}
                    />
                  </td>

                  <td>
                    <input 
                        className="form-control form-control-sm"
                        list="datalist-areas" 
                        placeholder="Elegir..."
                        value={paper.area || ''}
                        onChange={(e) => updateField(paper.id, 'area', e.target.value)}
                    />
                  </td>

                  <td className="text-center">
                    <button 
                      onClick={() => toggleVisibility(paper.id, paper.is_visible)} 
                      className={`btn btn-sm border-0 ${paper.is_visible ? 'text-success' : 'text-secondary'}`}
                      title={paper.is_visible ? "Visible" : "Oculto"}
                    >
                      <i className={`bi ${paper.is_visible ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`} style={{fontSize: '1.2rem'}}></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Listas invisibles para autocompletado */}
      <datalist id="datalist-categorias">
        <option value="Revista (Journal)" />
        <option value="Congreso (Conference)" />
        <option value="Libro" />
        <option value="Capítulo de Libro" />
        <option value="Tesis" />
      </datalist>

      <datalist id="datalist-areas">
        <option value="Inteligencia Artificial" />
        <option value="Educación" />
        <option value="Salud Digital" />
        <option value="Ciencia de Datos" />
        <option value="Ética" />
      </datalist>

    </div>
  );
}