import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AgendaViewer() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgenda();
  }, []);

  const fetchAgenda = async () => {
    const { data, error } = await supabase
      .from('agenda')
      .select('*')
      .order('fecha_evento', { ascending: true });

    if (error) console.error('Error cargando agenda:', error);
    else setEventos(data);
    setLoading(false);
  };

  if (loading) return <p className="text-center py-10">Cargando agenda...</p>;

  // --- NUEVA LÓGICA DE FILTRADO ---
  const hoy = new Date();

  // Un evento es FUTURO si su fecha de fin es mayor a hoy.
  // Si no tiene fecha fin, usamos la fecha de inicio.
  const futuros = eventos.filter(e => {
    const fin = e.fecha_fin ? new Date(e.fecha_fin) : new Date(e.fecha_evento);
    return fin >= hoy;
  });

  // Un evento es PASADO si su fecha de fin (o inicio) ya ocurrió.
  const pasados = eventos.filter(e => {
    const fin = e.fecha_fin ? new Date(e.fecha_fin) : new Date(e.fecha_evento);
    return fin < hoy;
  }).reverse(); // Mostramos el pasado más reciente primero

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* SECCIÓN FUTUROS */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold border-b-4 border-blue-500 inline-block mb-6">
          Próximos Eventos
        </h2>
        {futuros.length === 0 ? (
          <p className="text-gray-500 italic">No hay actividades próximas.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {futuros.map((evento) => (
              <EventoCard key={evento.id} evento={evento} esFuturo={true} />
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN PASADOS */}
      <div>
        <h2 className="text-2xl font-bold text-gray-600 border-b-2 border-gray-300 inline-block mb-6">
          Historial de Eventos
        </h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 opacity-75 hover:opacity-100 transition duration-300">
          {pasados.map((evento) => (
            <EventoCard key={evento.id} evento={evento} esFuturo={false} />
          ))}
        </div>
      </div>

    </div>
  );
}

// --- COMPONENTE TARJETA ACTUALIZADO ---
function EventoCard({ evento, esFuturo }) {
  
  // Función para formatear rangos de fecha inteligentemente
  const formatearFecha = (inicioStr, finStr) => {
    const inicio = new Date(inicioStr);
    const fin = finStr ? new Date(finStr) : null;
    
    // Opciones de formato base
    const dateOpts = { weekday: 'long', day: 'numeric', month: 'long' };
    const timeOpts = { hour: '2-digit', minute: '2-digit' };

    // Si no hay fecha fin, mostrar solo inicio
    if (!fin) {
      return inicio.toLocaleDateString('es-CL', { ...dateOpts, ...timeOpts });
    }

    // Verificar si es el MISMO DÍA
    const esMismoDia = inicio.toDateString() === fin.toDateString();

    if (esMismoDia) {
      // Ejemplo: Lunes 10 Enero | 10:00 - 12:00
      return (
        <>
          <span className="capitalize">{inicio.toLocaleDateString('es-CL', dateOpts)}</span>
          <br />
          <span className="text-gray-600 font-normal">
             {inicio.toLocaleTimeString('es-CL', timeOpts)} - {fin.toLocaleTimeString('es-CL', timeOpts)} hrs
          </span>
        </>
      );
    } else {
      // Ejemplo: 10 Enero - 12 Enero
      return (
        <span className="capitalize">
          {inicio.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} 
          {' -> '} 
          {fin.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
        </span>
      );
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white shadow-md rounded-xl overflow-hidden border transition hover:shadow-xl
      ${esFuturo ? 'border-blue-100' : 'border-gray-200 grayscale-[0.3] hover:grayscale-0'}`}>
      
      {/* Imagen Header */}
      <div className="h-48 overflow-hidden bg-gray-100 relative">
        {evento.imagen_url ? (
          <img src={evento.imagen_url} alt={evento.titulo} className="w-full h-full object-cover transition hover:scale-105 duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span>Sin Imagen</span>
          </div>
        )}
        <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full text-white shadow-sm
          ${evento.tipo === 'Seminario' ? 'bg-purple-600' : 
            evento.tipo === 'Taller' ? 'bg-orange-500' : 
            evento.tipo === 'Noticia' ? 'bg-green-600' : 'bg-blue-600'}`}>
          {evento.tipo || 'Evento'}
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Fecha destacada */}
        <div className="text-sm text-blue-600 font-bold mb-2 uppercase tracking-wide">
          {formatearFecha(evento.fecha_evento, evento.fecha_fin)}
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2 leading-tight">{evento.titulo}</h3>
        
        {evento.lugar && (
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
            {evento.lugar}
          </p>
        )}

        <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
          {evento.descripcion}
        </p>
        
        {evento.link_externo && (
          <a href={evento.link_externo} target="_blank" rel="noopener noreferrer" 
             className="mt-auto inline-block text-center w-full py-2 rounded-lg border border-blue-600 text-blue-600 font-semibold hover:bg-blue-600 hover:text-white transition">
             {evento.tipo === 'Noticia' ? 'Leer más' : 'Inscribirse'}
          </a>
        )}
      </div>
    </div>
  );
}