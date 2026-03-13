import React, { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [currentPath, setCurrentPath] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    // 1. Detectar URL activa y tamaño de pantalla
    useEffect(() => {
        setCurrentPath(window.location.pathname);

        const handleResize = () => setIsMobile(window.innerWidth < 1200);
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper para saber si un link está activo
    const isActive = (path) => currentPath === path || (path !== '/' && currentPath.startsWith(path));

    // 2. Lógica del Mouse
    const handleMouseEnter = (menuName) => {
        if (!isMobile) setActiveDropdown(menuName);
    };

    const handleMouseLeave = () => {
        if (!isMobile) setActiveDropdown(null);
    };

    const handleClickDropdown = (menuName, e) => {
        if (isMobile) {
            e.preventDefault();
            setActiveDropdown(activeDropdown === menuName ? null : menuName);
        }
    };

    return (
        <nav className="navbar navbar-expand-xl fixed-top border-0 navbar-custom" id="mainNav">
            <div className="container">

                {/* LOGOS */}
                <a className="navbar-brand d-flex align-items-center py-0" href="/">
                    <img src="/img/logo-ufro.png" alt="Logo UFRO" height="70" className="d-inline-block" />
                    <div className="vr mx-3 bg-light opacity-50 d-none d-sm-block" style={{ height: '50px', width: '1px' }}></div>
                    <img src="/img/logo-ci2a2.png" alt="Logo CI2A2" height="70" className="d-inline-block" />
                </a>

                {/* BOTÓN HAMBURGUESA */}
                <button
                    className="navbar-toggler border-0 shadow-none"
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
                </button>

                {/* CONTENIDO DEL MENÚ */}
                <div
                    className={`collapse navbar-collapse justify-content-end ${isOpen ? 'show navbar-collapse-react' : ''}`}
                    id="navbarContent"
                >
                    <ul className="navbar-nav align-items-xl-center gap-1 gap-xl-2 mb-2 mb-xl-0">

                        {/* 1. INICIO */}
                        <li className="nav-item">
                            <a className={`nav-link-react ${isActive('/') ? 'active' : ''}`} href="/">Inicio</a>
                        </li>

                        {/* 2. INSTITUCIONAL (Dropdown) */}
                        <li
                            className="nav-item dropdown-wrapper"
                            onMouseEnter={() => handleMouseEnter('institucion')}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div
                                className={`nav-link-react ${['/nosotros', '/alianzas', '/transparencia', '/equipo'].some(p => isActive(p)) ? 'active' : ''}`}
                                onClick={(e) => handleClickDropdown('institucion', e)}
                                role="button"
                            >
                                Institución <i className={`bi bi-chevron-down chevron-icon ${activeDropdown === 'institucion' ? 'rotate-180' : ''}`}></i>
                            </div>

                            {activeDropdown === 'institucion' && (
                                <div className="dropdown-menu-react">
                                    <a className="dropdown-item-react" href="/nosotros">
                                        <i className="bi bi-people-fill"></i> Nosotros
                                    </a>
                                    <a className="dropdown-item-react" href="/equipo">
                                        <i className="bi bi-person-badge-fill"></i> Equipo
                                    </a>
                                    <a className="dropdown-item-react" href="/alianzas">
                                        <i className="bi bi-diagram-3-fill"></i> Alianzas
                                    </a>
                                    <div className="dropdown-divider"></div>
                                    <a className="dropdown-item-react" href="/transparencia">
                                        <i className="bi bi-file-earmark-lock2-fill"></i> Transparencia
                                    </a>
                                </div>
                            )}
                        </li>

                        {/* 3. PROYECTOS */}
                        <li className="nav-item">
                            <a className={`nav-link-react ${isActive('/proyectos') ? 'active' : ''}`} href="/proyectos">Proyectos</a>
                        </li>

                        {/* 4. AGENDA */}
                        <li className="nav-item">
                            <a className={`nav-link-react ${isActive('/agenda') ? 'active' : ''}`} href="/agenda">Agenda</a>
                        </li>

                        {/* 5. DIFUSIÓN (Dropdown + BIBLIOTECA) */}
                        <li
                            className="nav-item dropdown-wrapper"
                            onMouseEnter={() => handleMouseEnter('difusion')}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div
                                // AQUI AGREGAMOS '/biblioteca' PARA QUE SE MARQUE ACTIVO
                                className={`nav-link-react ${['/noticias', '/publicaciones', '/biblioteca'].some(p => isActive(p)) ? 'active' : ''}`}
                                onClick={(e) => handleClickDropdown('difusion', e)}
                                role="button"
                            >
                                Difusión <i className="bi bi-chevron-down chevron-icon"></i>
                            </div>

                            {activeDropdown === 'difusion' && (
                                <div className="dropdown-menu-react">
                                    <a className="dropdown-item-react" href="/noticias">
                                        <i className="bi bi-newspaper"></i> Noticias
                                    </a>
                                    <a className="dropdown-item-react" href="/publicaciones">
                                        <i className="bi bi-file-earmark-text-fill"></i> Publicaciones
                                    </a>
                                    {/* NUEVO ITEM: BIBLIOTECA */}
                                    <div className="dropdown-divider"></div>
                                    <a className="dropdown-item-react" href="/biblioteca">
                                        <i className="bi bi-collection-play-fill"></i> Biblioteca Digital
                                    </a>
                                </div>
                            )}
                        </li>

                        {/* 6. CONTACTO */}
                        <li className="nav-item">
                            <a className={`nav-link-react ${isActive('/contacto') ? 'active' : ''}`} href="/contacto">Contacto</a>
                        </li>

                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;