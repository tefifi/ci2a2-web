import { useState, useEffect } from 'react';

/**
 * Hook para manejar mensajes/alertas con auto-dismiss.
 * Reemplaza el patrón useState + useEffect repetido en cada Admin.
 *
 * Uso:
 *   const { mensaje, mostrarMensaje, limpiarMensaje } = useMensaje();
 *   mostrarMensaje('success', '¡Guardado correctamente!');
 *   mostrarMensaje('danger', 'Error al guardar.');
 */
export function useMensaje(duracion = 3000) {
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    if (!mensaje) return;
    const timer = setTimeout(() => setMensaje(null), duracion);
    return () => clearTimeout(timer);
  }, [mensaje, duracion]);

  const mostrarMensaje = (tipo, texto) => setMensaje({ tipo, texto });
  const limpiarMensaje = () => setMensaje(null);

  return { mensaje, mostrarMensaje, limpiarMensaje };
}