import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useMensaje } from './hooks/useMensaje';

// Mapea el tipo de staging a la tabla pública destino y cómo traducir
// el payload guardado en staging al shape que esa tabla espera.
const DESTINOS = {
  noticia: {
    tabla: 'noticias',
    mapear: (p) => ({
      titulo: p.titulo,
      bajada: p.bajada,
      cuerpo: p.cuerpo || '',
      fecha: p.fecha,
      image_url: p.image_url,
      destacada: false,
    }),
  },
  publicacion: {
    tabla: 'publicaciones',
    mapear: (p) => ({
      title: p.titulo,
      year: p.year,
      autores: p.autores,
      url: p.url,
      is_visible: true,
    }),
  },
  biblioteca: {
    tabla: 'biblioteca',
    mapear: (p) => ({
      titulo: p.titulo,
      descripcion: p.descripcion || '',
      url: p.url,
      imagen_url: p.imagen_url || null,
      tipo: p.tipo || 'link',
      autor: p.autor || null,
      destacado: false,
    }),
  },
  colaborador: {
    // colaborador es un caso especial: es un UPDATE parcial sobre un
    // colaborador existente (identificado por colaborador_id), no un insert.
    // Solo se envían los campos que el scraper realmente trae — nunca todo
    // el payload tal cual (podría incluir campos que no son columnas reales,
    // como "titulo", que solo se usa para mostrar el nombre en esta pantalla).
    tabla: 'colaboradores',
    esUpdate: true,
    mapear: (p) => {
      const cambios = {};
      if (p.bio) cambios.bio = p.bio;
      if (p.institucion) cambios.institucion = p.institucion;
      if (p.cargo) cambios.cargo = p.cargo;
      if (p.area_investigacion) cambios.area_investigacion = p.area_investigacion;
      return cambios;
    },
  },
};

const TIPOS = [
  { key: 'noticia', label: 'Noticias' },
  { key: 'publicacion', label: 'Publicaciones' },
  { key: 'biblioteca', label: 'Biblioteca' },
  { key: 'colaborador', label: 'Colaboradores' },
];

// Campos "de contenido" que vale la pena previsualizar en la tarjeta,
// aparte del título/URL que ya se muestran por separado. Los campos que no
// están en el payload de un item simplemente no aparecen.
const CAMPOS_PREVIEW = [
  { key: 'bajada', label: 'Bajada' },
  { key: 'year', label: 'Año' },
  { key: 'autores', label: 'Autores' },
  { key: 'autor', label: 'Autor' },
  { key: 'descripcion', label: 'Descripción' },
];

function renderDetalles(payload) {
  return CAMPOS_PREVIEW.filter(({ key }) => payload[key]);
}

// Campos de colaborador que se muestran como comparación "Actual → Propuesto"
// (a diferencia de los de arriba, que solo tienen un valor "propuesto" sin
// dato previo con el cual comparar).
const CAMPOS_COLABORADOR = [
  { key: 'bio', label: 'Bio' },
  { key: 'institucion', label: 'Institución' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'area_investigacion', label: 'Área de investigación' },
];

export default function AdminRevision() {
  const [tabActiva, setTabActiva] = useState('noticia');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actuales, setActuales] = useState({}); // colaborador_id -> {bio, institucion, cargo, area_investigacion}
  const { mensaje, mostrarMensaje } = useMensaje();

  const fetchPendientes = useCallback(async (tipo) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contenido_staging')
      .select('*')
      .eq('tipo', tipo)
      .eq('estado', 'pendiente')
      .order('creado_en', { ascending: false });

    if (error) {
      mostrarMensaje('danger', 'Error al cargar pendientes: ' + error.message);
      setLoading(false);
      return;
    }

    // Las marcadas como relacionadas a IA/líneas del centro van primero,
    // para priorizar la revisión (no descarta nada, solo ordena).
    const ordenados = [...(data || [])].sort((a, b) => {
      const relA = a.payload?.relevante_ia ? 1 : 0;
      const relB = b.payload?.relevante_ia ? 1 : 0;
      return relB - relA;
    });
    setItems(ordenados);

    // Para colaboradores, traer el valor ACTUAL de cada persona involucrada,
    // para poder mostrar "Actual → Propuesto" en vez de solo el propuesto.
    if (tipo === 'colaborador' && ordenados.length > 0) {
      const ids = [...new Set(ordenados.map((i) => i.colaborador_id).filter(Boolean))];
      const { data: colaboradoresData, error: errorColab } = await supabase
        .from('colaboradores')
        .select('id, bio, institucion, cargo, area_investigacion')
        .in('id', ids);

      if (!errorColab) {
        const mapa = {};
        (colaboradoresData || []).forEach((c) => {
          mapa[c.id] = c;
        });
        setActuales(mapa);
      }
    } else {
      setActuales({});
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPendientes(tabActiva);
  }, [tabActiva, fetchPendientes]);

  const aprobar = async (item) => {
    const destino = DESTINOS[item.tipo];
    try {
      if (destino.esUpdate) {
        // colaborador: actualiza el registro existente en vez de insertar uno nuevo
        const { error } = await supabase
          .from(destino.tabla)
          .update(destino.mapear(item.payload))
          .eq('id', item.colaborador_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(destino.tabla)
          .insert([destino.mapear(item.payload)]);
        if (error) throw error;
      }

      await supabase
        .from('contenido_staging')
        .update({ estado: 'aprobado', revisado_en: new Date().toISOString() })
        .eq('id', item.id);

      mostrarMensaje('success', `"${item.payload.titulo || 'Item'}" publicado.`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      mostrarMensaje('danger', 'Error al aprobar: ' + err.message);
    }
  };

  const rechazar = async (item) => {
    const { error } = await supabase
      .from('contenido_staging')
      .update({ estado: 'rechazado', revisado_en: new Date().toISOString() })
      .eq('id', item.id);

    if (error) {
      mostrarMensaje('danger', 'Error al rechazar: ' + error.message);
    } else {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  return (
    <div>
      <h2 className="mb-3">Revisión de contenido scrapeado</h2>

      {mensaje && (
        <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <ul className="nav nav-tabs mb-3">
        {TIPOS.map((t) => (
          <li className="nav-item" key={t.key}>
            <button
              className={`nav-link ${tabActiva === t.key ? 'active' : ''}`}
              onClick={() => setTabActiva(t.key)}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      {loading && <p>Cargando...</p>}

      {!loading && items.length === 0 && (
        <p className="text-muted">No hay pendientes en esta categoría.</p>
      )}

      <div className="list-group">
        {items.map((item) => (
          <div key={item.id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong>{item.payload.titulo || item.payload.nombre || '(sin título)'}</strong>
                {item.payload.relevante_ia && (
                  <span className="badge bg-success ms-2">Posible IA / línea del centro</span>
                )}
                <div className="small text-muted">
                  Fuente: {item.fuente} · {new Date(item.creado_en).toLocaleDateString('es-CL')}
                </div>
                {item.payload.url && (
                  <a href={item.payload.url} target="_blank" rel="noreferrer" className="small">
                    Ver original
                  </a>
                )}

                {renderDetalles(item.payload).length > 0 && (
                  <div className="mt-2 small">
                    {renderDetalles(item.payload).map(({ key, label }) => (
                      <div key={key}>
                        <strong>{label}:</strong> {item.payload[key]}
                      </div>
                    ))}
                  </div>
                )}

                {item.tipo === 'colaborador' && (
                  <div className="mt-2 small">
                    {CAMPOS_COLABORADOR.filter(({ key }) => item.payload[key]).map(({ key, label }) => {
                      const actual = actuales[item.colaborador_id]?.[key];
                      return (
                        <div key={key} className="mb-1">
                          <strong>{label}:</strong>
                          <div className="ps-2">
                            <span className="text-muted">Actual: {actual || <em>(vacío)</em>}</span>
                            <br />
                            <span className="text-success">Propuesto: {item.payload[key]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-success" onClick={() => aprobar(item)}>
                  Aprobar
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => rechazar(item)}>
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
