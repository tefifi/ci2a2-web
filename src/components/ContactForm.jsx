import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';

// Anti-spam (del lado del cliente):
// 1. Honeypot: un campo oculto que los humanos no ven y los bots suelen llenar.
// 2. Tiempo mínimo: un humano no completa el formulario en menos de unos segundos.
// 3. Enfriamiento: no se puede enviar otro mensaje durante un minuto desde el mismo navegador.
const MIN_SEGUNDOS = 3;
const COOLDOWN_MS = 60 * 1000;
const CLAVE_ULTIMO_ENVIO = 'contactForm:ultimoEnvio';

// Agregamos la prop 'mostrarCarrera'
/** @param {{ titulo: any, descripcion: any, destinatario?: string | null, mostrarCarrera?: boolean }} props */
export default function ContactForm({ titulo, descripcion, destinatario = null, mostrarCarrera = false }) {

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        carrera: '',
        asunto: '',
        mensaje: ''
    });
    const [status, setStatus] = useState(null);
    const [honeypot, setHoneypot] = useState('');
    const montadoEn = useRef(Date.now());

    const handleSubmit = (e) => {
        e.preventDefault();
        if (status === 'sending') return;

        // 1. Honeypot lleno: es un bot. Fingimos éxito para que no reintente.
        if (honeypot) {
            setStatus('success');
            return;
        }

        // 2. Demasiado rápido para ser una persona
        if (Date.now() - montadoEn.current < MIN_SEGUNDOS * 1000) {
            setStatus('rapido');
            return;
        }

        // 3. Enfriamiento entre envíos
        try {
            const ultimo = Number(localStorage.getItem(CLAVE_ULTIMO_ENVIO) || 0);
            if (Date.now() - ultimo < COOLDOWN_MS) {
                setStatus('espera');
                return;
            }
        } catch {
            // Si localStorage no está disponible, seguimos sin enfriamiento
        }

        setStatus('sending');

        const destinatarioFinal = destinatario ? destinatario : 'Contacto General';

        const templateParams = {
            user_name: formData.nombre,
            user_email: formData.email,
            destinatario_interes: destinatarioFinal,
            message: formData.mensaje,
            subject: formData.asunto,
            tipo_formulario: titulo,
            // 2. Enviamos la carrera si existe, o un texto por defecto si no
            user_career: formData.carrera || 'No aplica (Formulario General)'
        };

        emailjs.send(
            import.meta.env.PUBLIC_EMAILJS_SERVICE_ID,
            import.meta.env.PUBLIC_EMAILJS_TEMPLATE_ID,
            templateParams,
            import.meta.env.PUBLIC_EMAILJS_PUBLIC_KEY
        )
            .then(() => {
                setStatus('success');
                setFormData({ nombre: '', email: '', carrera: '', asunto: '', mensaje: '' });
                try {
                    localStorage.setItem(CLAVE_ULTIMO_ENVIO, String(Date.now()));
                } catch {
                    // Sin localStorage no se guarda el enfriamiento
                }
            })
            .catch((error) => {
                console.error('FAILED...', error);
                setStatus('error');
            });
    };

    return (
        <div className="bg-white p-4 rounded-4 shadow-sm border border-light">
            <h3 className="fw-bold mb-2" style={{color: 'var(--ufro-blue)'}}>{titulo}</h3>
            <p className="text-secondary mb-4 small">{descripcion}</p>

            {destinatario && (
                <div className="d-flex align-items-center bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-3 p-3 mb-4 animate-fade-in">
                    <i className="bi bi-person-check-fill text-primary me-2 fs-5"></i>
                    <span className="text-dark small">
                        Enviando mensaje a: <strong className="text-primary">{destinatario}</strong>
                    </span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                {/* Honeypot: invisible para personas, los bots lo llenan */}
                <div
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
                >
                    <label>
                        No llenes este campo
                        <input
                            type="text"
                            name="sitio_web"
                            tabIndex={-1}
                            autoComplete="off"
                            value={honeypot}
                            onChange={(e) => setHoneypot(e.target.value)}
                        />
                    </label>
                </div>

                <div>
                    <label className="form-label small fw-bold text-secondary">Tu nombre</label>
                    <input type="text" className="form-control bg-light border-0" required maxLength={100} value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div>
                    <label className="form-label small fw-bold text-secondary">Tu correo</label>
                    <input type="email" className="form-control bg-light border-0" required maxLength={254} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>

                {/* 3. CAMPO CARRERA (Condicional: Solo se muestra si mostrarCarrera es true) */}
                {mostrarCarrera && (
                    <div className="animate-fade-in">
                        <label className="form-label small fw-bold text-secondary">Carrera / Institución</label>
                        <input
                            type="text"
                            className="form-control bg-light border-0"
                            required={mostrarCarrera} // Es obligatorio solo si se muestra
                            maxLength={150}
                            placeholder="Ej: Ingeniería Civil Informática"
                            value={formData.carrera}
                            onChange={(e) => setFormData({...formData, carrera: e.target.value})}
                        />
                    </div>
                )}

                <div>
                    <label className="form-label small fw-bold text-secondary">Asunto</label>
                    <input
                        type="text"
                        className="form-control bg-light border-0"
                        required
                        maxLength={150}
                        value={formData.asunto}
                        onChange={(e) => setFormData({...formData, asunto: e.target.value})}
                    />
                </div>
                <div>
                    <label className="form-label small fw-bold text-secondary">Mensaje</label>
                    <textarea className="form-control bg-light border-0" rows="4" required maxLength={2000} value={formData.mensaje} onChange={(e) => setFormData({...formData, mensaje: e.target.value})}></textarea>
                </div>

                <button type="submit" className="btn fw-bold w-100 py-2 mt-2 text-white" style={{backgroundColor: 'var(--ufro-blue)'}} disabled={status === 'sending'}>
                    {status === 'sending' ? 'Enviando...' : 'Enviar mensaje'}
                </button>

                {status === 'success' && <div className="alert alert-success small text-center mt-2 fw-bold">¡Mensaje enviado con éxito!</div>}
                {status === 'error' && <div className="alert alert-danger small text-center mt-2 fw-bold">Hubo un error al enviar.</div>}
                {status === 'rapido' && <div className="alert alert-warning small text-center mt-2 fw-bold">Espera unos segundos antes de enviar.</div>}
                {status === 'espera' && <div className="alert alert-warning small text-center mt-2 fw-bold">Ya enviaste un mensaje hace poco. Intenta de nuevo en un minuto.</div>}
            </form>
        </div>
    );
}