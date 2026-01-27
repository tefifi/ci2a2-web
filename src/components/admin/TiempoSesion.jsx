// Archivo: src/components/admin/TiempoSesion.jsx
import { useEffect } from 'react';

export default function TiempoSesion({ minutes = 0.1 }) {
  useEffect(() => {
    // Convertimos minutos a milisegundos
    const tiempoLimite = minutes * 60 * 1000;
    let timer;

    // Función para cerrar la sesión
    const ejecutarSalida = async () => {
      console.log("Tiempo de sesión agotado. Cerrando...");
      
      try {
        // Llamamos a tu API de logout existente
        await fetch('/api/auth/logout', { method: 'POST' });
        
        // Redirigimos al login
        window.location.href = '/login?expired=true';
      } catch (error) {
        console.error("Error al cerrar sesión", error);
      }
    };

    // Reiniciar el contador si hay actividad
    const reiniciarReloj = () => {
      clearTimeout(timer);
      timer = setTimeout(ejecutarSalida, tiempoLimite);
    };

    // Eventos que detectan que el admin está vivo
    const eventos = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove', 'click'];

    // Activar los "oídos" del vigilante
    eventos.forEach(evento => document.addEventListener(evento, reiniciarReloj));

    // Iniciar el primer conteo
    reiniciarReloj();

    // Limpieza al salir de la página
    return () => {
      clearTimeout(timer);
      eventos.forEach(evento => document.removeEventListener(evento, reiniciarReloj));
    };
  }, [minutes]);

  // No renderiza nada visualmente
  return null;
}