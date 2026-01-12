import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { syncZoteroToSupabase } from '../../lib/zotero';
import styles from './AdminGlobal.module.css';

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

      {/* --- BARRA SUPERIOR UNIFICADA --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className={`mb-1 ${styles.titulo}`}>Gestión de Publicaciones</h2>
          <small className="text-muted">Total: {papers.length} documentos</small>        \
          </div>

        <button
          onClick={() => handleSync(false)}
          disabled={syncing}
          className="btn btn-primary btn-sm d-flex align-items-center gap-2"
        >
          {syncing ? (
            <>
              <span className="spinner-border spinner-border-sm"></span>
              Sincronizando...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-repeat"></i>
              Sincronizar con Zotero
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted small">Cargando biblioteca...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="bg-light text-secondary small text-uppercase">
              <tr>
                <th style={{ width: '60px' }}>Año</th>
                <th>Título / Autores</th>
                <th style={{ width: '150px' }}>Tipo</th>
                <th style={{ width: '180px' }}>Área Temática</th>
                <th style={{ width: '80px' }} className="text-center">Visible</th>
              </tr>
            </thead>
            <tbody>
              {papers.map(paper => (
                <tr key={paper.id}>
                  <td className="fw-bold text-secondary">{paper.year}</td>
                  <td>
                    <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.95rem' }}>{paper.title}</div>
                    <div className="small text-muted text-truncate" style={{ maxWidth: '400px' }}>{paper.autores}</div>
                  </td>
                  <td>
                    <input
                      list="datalist-categorias"
                      className="form-control form-control-sm border-0 bg-light"
                      placeholder="Elegir..."
                      value={paper.type || ''}
                      onChange={(e) => updateField(paper.id, 'type', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      list="datalist-areas"
                      className="form-control form-control-sm border-0 bg-light"
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
                      <i className={`bi ${paper.is_visible ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`} style={{ fontSize: '1.2rem' }}></i>
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
        <option value="Industria 4.0" />
      </datalist>
    </div>
  );
}