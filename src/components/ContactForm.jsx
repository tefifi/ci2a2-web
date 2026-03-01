import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

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

    const handleSubmit = (e) => {
        e.preventDefault();
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
            })
            .catch((error) => {
                console.error('FAILED...', error);
                setStatus('error');
            });
    };

    return (
        <div className="bg-white p-4 rounded-4 shadow-sm border border-light">
            <h3 className="fw-bold mb-2" style={{color: '#003767'}}>{titulo}</h3>
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
                <div>
                    <label className="form-label small fw-bold text-secondary">Tu Nombre</label>
                    <input type="text" className="form-control bg-light border-0" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div>
                    <label className="form-label small fw-bold text-secondary">Tu Correo</label>
                    <input type="email" className="form-control bg-light border-0" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>

                {/* 3. CAMPO CARRERA (Condicional: Solo se muestra si mostrarCarrera es true) */}
                {mostrarCarrera && (
                    <div className="animate-fade-in">
                        <label className="form-label small fw-bold text-secondary">Carrera / Institución</label>
                        <input 
                            type="text" 
                            className="form-control bg-light border-0" 
                            required={mostrarCarrera} // Es obligatorio solo si se muestra
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
                        value={formData.asunto} 
                        onChange={(e) => setFormData({...formData, asunto: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="form-label small fw-bold text-secondary">Mensaje</label>
                    <textarea className="form-control bg-light border-0" rows="4" required value={formData.mensaje} onChange={(e) => setFormData({...formData, mensaje: e.target.value})}></textarea>
                </div>

                <button type="submit" className="btn fw-bold w-100 py-2 mt-2 text-white" style={{backgroundColor: '#003767'}} disabled={status === 'sending'}>
                    {status === 'sending' ? 'Enviando...' : 'Enviar Mensaje'}
                </button>

                {status === 'success' && <div className="alert alert-success small text-center mt-2 fw-bold">¡Mensaje enviado con éxito!</div>}
                {status === 'error' && <div className="alert alert-danger small text-center mt-2 fw-bold">Hubo un error al enviar.</div>}
            </form>
        </div>
    );
}