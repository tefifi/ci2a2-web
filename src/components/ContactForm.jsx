import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';

const ContactForm = () => {
  // --- CONFIGURACIÓN EMAILJS ---
  const SERVICE_ID = 'TU_SERVICE_ID';
  const TEMPLATE_ID = 'TU_TEMPLATE_ID';
  const PUBLIC_KEY = 'TU_PUBLIC_KEY';

  const [activeTab, setActiveTab] = useState('investigador'); 
  const [researcherName, setResearcherName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); 

  const [formData, setFormData] = useState({
    nombre: '', email: '', institucion: '', carrera: '', asunto: '', mensaje: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const para = params.get('para');
    if (para) {
      setActiveTab('investigador');
      setResearcherName(para);
      setFormData(prev => ({ ...prev, asunto: `Contacto con investigador: ${para}` }));
    }
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const templateParams = {
      to_name: "Equipo CI2A2",
      from_name: formData.nombre,
      from_email: formData.email,
      subject: activeTab === 'practica' ? `[Práctica] ${formData.carrera}` : formData.asunto,
      message: formData.mensaje,
      type_contact: activeTab === 'practica' ? 'Solicitud de Práctica/Tesis' : 'Contacto General/Investigación',
      institution: formData.institucion || 'N/A',
      career: formData.carrera || 'N/A',
      specific_researcher: researcherName || 'General'
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
      .then(() => { setSubmitStatus('success'); setIsSubmitting(false); }, 
            () => { setSubmitStatus('error'); setIsSubmitting(false); });
  };

  if (submitStatus === 'success') {
    return (
      <div className="text-center p-5 bg-white rounded-4 shadow-sm h-100 d-flex flex-column justify-content-center align-items-center animate-fade-in">
        <i className="bi bi-check-circle-fill text-success mb-3" style={{ fontSize: '3.5rem' }}></i>
        <h3 className="fw-bold text-dark">¡Mensaje Enviado!</h3>
        <p className="text-muted">El equipo CI2A2 te responderá pronto.</p>
        <button onClick={() => { setSubmitStatus(null); setFormData({...formData, mensaje: ''}); }} className="btn btn-outline-primary rounded-pill mt-3">Nuevo mensaje</button>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-light h-100">
      <h3 className="fw-bold mb-4" style={{ color: 'var(--ufro-blue)' }}>Escríbenos</h3>
      
      {/* TABS DE SELECCIÓN ESTILO "CENIA" */}
      <div className="d-flex gap-2 mb-4 p-1 bg-light rounded-3">
        <button 
          type="button"
          onClick={() => setActiveTab('investigador')}
          className={`btn w-50 fw-bold rounded-3 py-2 transition-all ${activeTab === 'investigador' ? 'bg-white shadow-sm text-primary' : 'text-muted border-0'}`}
        >
          General / Colaboración
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('practica')}
          className={`btn w-50 fw-bold rounded-3 py-2 transition-all ${activeTab === 'practica' ? 'bg-white shadow-sm text-primary' : 'text-muted border-0'}`}
        >
          Soy Estudiante
        </button>
      </div>

      <form onSubmit={handleSubmit} className="row g-3">
        {/* Nombre y Email */}
        <div className="col-md-6">
          <label className="form-label small fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Nombre</label>
          <input required type="text" className="form-control bg-light border-0" name="nombre" value={formData.nombre} onChange={handleChange} />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Email</label>
          <input required type="email" className="form-control bg-light border-0" name="email" value={formData.email} onChange={handleChange} />
        </div>

        {/* Condicionales */}
        {activeTab === 'practica' ? (
          <>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Institución</label>
              <input required type="text" className="form-control bg-light border-0" name="institucion" placeholder="Ej. UFRO" value={formData.institucion} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Carrera</label>
              <input required type="text" className="form-control bg-light border-0" name="carrera" placeholder="Ej. Informática" value={formData.carrera} onChange={handleChange} />
            </div>
          </>
        ) : (
          <div className="col-12">
            <label className="form-label small fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Asunto</label>
            <input required type="text" className="form-control bg-light border-0" name="asunto" value={formData.asunto} onChange={handleChange} />
            {researcherName && <small className="text-primary mt-1 d-block"><i className="bi bi-arrow-return-right"></i> Contactando a: <strong>{researcherName}</strong></small>}
          </div>
        )}

        <div className="col-12">
          <label className="form-label small fw-bold text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Mensaje</label>
          <textarea required className="form-control bg-light border-0" rows="5" name="mensaje" value={formData.mensaje} onChange={handleChange}></textarea>
        </div>

        <div className="col-12 mt-4">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-100 py-3 rounded-3 fw-bold" style={{ backgroundColor: 'var(--ufro-pink)', borderColor: 'var(--ufro-pink)' }}>
            {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;