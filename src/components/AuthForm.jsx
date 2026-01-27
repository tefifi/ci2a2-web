import React, { useState } from 'react';

export default function AuthForm() {
    // Ya no necesitamos 'isLogin' porque SIEMPRE es login
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Solo llamamos a la API de login
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error('Credenciales incorrectas o acceso no autorizado');
            }

            // Redirigir al dashboard privado
            window.location.href = '/admin'; 

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div className="p-4 text-center text-white" style={{ background: 'linear-gradient(135deg, #003767 0%, #d63384 100%)' }}>
                <h3 className="fw-bold mb-0">Intranet CI2A2</h3>
                <p className="small opacity-75 mb-0">Acceso exclusivo funcionarios</p>
            </div>

            <div className="p-4 bg-white">
                {error && (
                    <div className="alert alert-danger small py-2 text-center animate-fade-in">
                        <i className="bi bi-lock-fill me-2"></i>{error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                    <div>
                        <label className="form-label small fw-bold text-secondary">Correo Institucional</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-person-badge text-primary"></i></span>
                            <input 
                                type="email" 
                                className="form-control bg-light border-0" 
                                placeholder="usuario@ufrontera.cl"
                                required 
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="form-label small fw-bold text-secondary">Contraseña</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-0"><i className="bi bi-key-fill text-primary"></i></span>
                            <input 
                                type="password" 
                                className="form-control bg-light border-0" 
                                placeholder="••••••••"
                                required 
                                value={formData.password} 
                                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn text-white fw-bold py-2 mt-3 rounded-3" 
                        style={{ background: '#003767' }} 
                        disabled={loading}
                    >
                        {loading ? 'Verificando...' : 'Acceder al Panel'}
                    </button>
                </form>
                
                <div className="text-center mt-3">
                    <p className="small text-muted mb-0">
                        ¿No tienes acceso? <br/>
                        Contacta a <a href="mailto:soporte@ci2a2.cl" className="text-decoration-none fw-bold" style={{color: '#d63384'}}>Administración</a>
                    </p>
                </div>
            </div>
        </div>
    );
}